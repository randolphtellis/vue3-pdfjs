<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js'
import PDFJSWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry'
import * as pdfjsViewer from 'pdfjs-dist/legacy/web/pdf_viewer'
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/types/src/display/api'
import { PageViewport } from 'pdfjs-dist/types/src/display/display_utils'
import { createLoadingTask } from './loading-task'
import 'pdfjs-dist/legacy/web/pdf_viewer.css'
import { VuePdfPropsType } from './vue-pdf-props'
import { IPDFLinkService } from 'pdfjs-dist/types/web/interfaces'

export default defineComponent({
  name: 'vue-pdf',

  props: {
    /**
     * The source of the pdf. Accepts the following types `string | URL | Uint8Array | PDFDataRangeTransport | DocumentInitParameters`
     */
    src: {
      type: [String, Object],
      required: true
    },
    /**
     * The page number of the pdf to display.
     */
    page: {
      type: Number,
      default: 1
    },
    /**
     * Whether to display all pages, dangerous!!
     */
    allPages: {
      type: Boolean,
      default: false
    },
    /**
     * The scale (zoom) of the pdf. Setting this will also disable auto scaling and resizing. 
     */
    scale: {
      type: Number,
      default: null
    },
    /**
     * Whether to enable text selection
     */
    enableTextSelection: {
      type: Boolean,
      default: true
    },
    /**
     * Whether to enable annotations (clickable links)
     */
    enableAnnotations: {
      type: Boolean,
      default: true
    },
    /**
     * page wrapper id prefix
     */
    wrapperIdPrefix: {
      type: String,
      default: 'vue-pdf-page'
    }
  },
  setup(props: VuePdfPropsType, ctx) {

    const loading = ref<boolean>(false)

    const pdfWrapperRef = ref<HTMLElement | null>(null)
    const parentWrapperRef = ref<HTMLElement | null>(null)

    const thePDF = ref<PDFDocumentProxy | null>(null)
    const numberOfPages = ref<number>(0)

    const eventBus = ref(null)
    const linkService = ref<IPDFLinkService | null>(null)

    const pageNumber = computed(() => props.page || 1)
    const allPages = computed(() => Boolean(props.allPages))
    const wrapperIdPrefix = computed(() => props.wrapperIdPrefix || 'vue-pdf-page')

    const initPdfWorker = () => {
      loading.value = true
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJSWorker
      const loadingTask = createLoadingTask(props.src)
      loadingTask.promise.then((pdf: PDFDocumentProxy) => {
        ctx.emit('pdfLoaded', pdf)
        thePDF.value = pdf
        numberOfPages.value = pdf.numPages
        ctx.emit('totalPages', numberOfPages.value)
        if (allPages.value) {
          // ignore pageNumber, display all pages
          const pagePromiseArr = new Array(numberOfPages.value).fill(0).map((v, idx) => pdf.getPage(idx + 1))
          Promise.all(pagePromiseArr).then(pages => pages.forEach(renderPage));
        } else if (pageNumber.value <= numberOfPages.value) {
          pdf.getPage(pageNumber.value).then((page: PDFPageProxy) => renderPage(page))
        }
      })
    }

    const renderPage = async (page: PDFPageProxy) => {

      loading.value = true

      const pdfWrapperEl = pdfWrapperRef.value as HTMLElement
      const parentWrapperEl = parentWrapperRef.value as HTMLElement

      // Create a wrapper for each page
      const pageWrapper = document.createElement('div')
      pageWrapper.classList.add('vue-pdf__wrapper')
      pageWrapper.id = `${wrapperIdPrefix.value}-${page.pageNumber}`

      // Create a canvas element for each page to draw on
      const canvas = document.createElement('canvas')
      pageWrapper.appendChild(canvas)

      // Create an annotation layer for each page
      const annotationLayer = document.createElement('div')
      if (props.enableAnnotations) {
        annotationLayer.classList.add('vue-pdf__wrapper-annotation-layer')
        pageWrapper.appendChild(annotationLayer)
      }

      // Create div which will hold text-fragments (for selection)
      const textLayerDiv = document.createElement('div');
      if (props.enableTextSelection) {
        textLayerDiv.classList.add('textLayer', 'vue-pdf__wrapper-text-layer')
        pageWrapper.appendChild(textLayerDiv)
      }

      pdfWrapperEl?.appendChild(pageWrapper)

      // This gives us the page's dimensions at full scale
      const initViewport = page.getViewport({ scale: 1 })
      

      const context = canvas.getContext('2d')
      await scaleCanvas(pdfWrapperEl, initViewport, page, canvas, context, textLayerDiv, annotationLayer)

      if(!props.scale) {
        const debouncedScaling = debounce(async () => await scaleCanvas(pdfWrapperEl, initViewport, page, canvas, context, textLayerDiv, annotationLayer))
        window.addEventListener('resize', debouncedScaling);
      } else {
        parentWrapperEl.style.display = 'inline-block';
        pdfWrapperEl.style.display = 'inline-block';
      }
    }

    const scaleCanvas = async (
      pdfWrapperEl: HTMLElement,
      intialisedViewport: PageViewport,
      page: PDFPageProxy,
      canvas: HTMLCanvasElement,
      context: any,
      textLayerDiv: HTMLDivElement,
      annotationLayer: HTMLDivElement
    ) => {

      textLayerDiv.innerHTML = ''
      annotationLayer.innerHTML = ''

      const pdfWrapperElStyles = window.getComputedStyle(pdfWrapperEl)
      const pdfWrapperElWidth = parseFloat(pdfWrapperElStyles.width)

      const scale = props.scale ? props.scale : pdfWrapperElWidth / intialisedViewport.width
      const viewport = page.getViewport({scale})

      // assume the device pixel ratio is 1 if the browser doesn't specify it
      const devicePixelRatio = window.devicePixelRatio || 1;

      // determine the 'backing store ratio' of the canvas context
      const backingStoreRatio = (
        context.webkitBackingStorePixelRatio ||
        context.mozBackingStorePixelRatio ||
        context.msBackingStorePixelRatio ||
        context.oBackingStorePixelRatio ||
        context.backingStorePixelRatio || 1
      );

      // determine the actual ratio we want to draw at
      const ratio = devicePixelRatio / backingStoreRatio;

      if (devicePixelRatio !== backingStoreRatio) {

        // set the 'real' canvas size to the higher width/height
        canvas.width = props.scale ? (viewport.width * ratio) : (pdfWrapperElWidth * ratio);
        canvas.height = viewport.height * ratio;

        // ...then scale it back down with CSS
        canvas.style.width = props.scale ? '' : '100%';
        canvas.style.height = viewport.height + 'px';
      }
      else {
        // this is a normal 1:1 device; just scale it simply
        canvas.width = props.scale ? viewport.width : pdfWrapperElWidth;
        canvas.height = viewport.height;
        canvas.style.width = '';
        canvas.style.height = '';
      }

      // scale the drawing context so everything will work at the higher ratio
      await context.scale(ratio, ratio);
      // Draw it on the canvas
      if (context) {
        page.render({ canvasContext: context, viewport }).promise.then(() => {
          
          // Render text layer for text selection
          if (props.enableTextSelection) {
            page.getTextContent().then((textContent) => {
              if (!eventBus.value) {
                eventBus.value = new pdfjsViewer.EventBus()
              }
              // Create new instance of TextLayerBuilder class
              const textLayer = new pdfjsViewer.TextLayerBuilder({
                textLayerDiv: textLayerDiv, 
                pageIndex: page._pageIndex,
                eventBus: eventBus.value,
                viewport: viewport,
                enhanceTextSelection: true
              })

              // Set text-fragments
              textLayer.setTextContent(textContent)
              ctx.emit('textContent', textContent)
              // Render text-fragments
              textLayer.render();
            })
          }

          if (props.enableAnnotations) {
            // Render annotation layer for clickable links
            page.getAnnotations().then((annotationData) => {
              annotationLayer.style.cssText = `left: 0; top: 0; height: ${viewport.height}px; width: ${props.scale ? viewport.width : pdfWrapperElWidth}px;`

              if (!linkService.value) {
                linkService.value = new pdfjsViewer.PDFLinkService({
                  eventBus: eventBus.value,
                  externalLinkEnabled: true,
                  externalLinkRel: 'noopener noreferrer nofollow',
                  externalLinkTarget: 2 // Blank
                })
              }
              // Render the annotation layer
              pdfjsLib.AnnotationLayer.render({
                viewport: viewport.clone({ dontFlip: true }),
                div: annotationLayer,
                annotations: annotationData,
                page: page,
                linkService: linkService.value as IPDFLinkService,
                downloadManager: '',
                renderForms: false
              })
            })
          }
          loading.value = false
          ctx.emit('pageLoaded', page)
        })
      }
    }

    const debounce = (func: { apply: (arg0: void, arg1: any) => void }, timeout = 300) => {
      let timer: number|undefined;
      return (...args: any) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
      };
    }

    onMounted(() => {
      initPdfWorker()
    })
    
    return {
      props,
      pdfWrapperRef,
      parentWrapperRef
    }
  }
})
</script>

<template>
  <div class="vue-pdf-main" ref="parentWrapperRef">
    <div class="vue-pdf" ref="pdfWrapperRef"></div>
  </div>
</template>

<style lang="scss">

.vue-pdf {
  &__wrapper {
    position: relative;

    &-text-layer {
      br {
        display: none;
      }
    }
    &-annotation-layer {
      position: absolute;
      .linkAnnotation {
        position: absolute;
        z-index: 1;
        a {
          width: 100%;
          height: 100%;
          display: inline-block;
        }
      }
    }
  }
}
</style>

