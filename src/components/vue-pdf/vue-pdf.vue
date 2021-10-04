<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js'
import PDFJSWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry'
import * as pdfjsApi from 'pdfjs-dist/types/display/api'
import * as pdfjsViewer from 'pdfjs-dist/legacy/web/pdf_viewer'
import 'pdfjs-dist/legacy/web/pdf_viewer.css'

export interface propsType {
  src: string | URL | pdfjsApi.TypedArray | pdfjsApi.PDFDataRangeTransport | pdfjsApi.DocumentInitParameters;
  page: number;
  enableTextSelection: boolean;
  enableAnnotations: boolean;
}

export default defineComponent({
  name: 'vue-pdf',

  props: {
    /**
     * The source of the pdf.
     * Accepts `string | URL | TypedArray | PDFDataRangeTransport | DocumentInitParameters`
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
    }
  },
  setup(props: propsType, ctx) {

    const loading = ref<boolean>(false)

    const pdfWrapperRef = ref<HTMLInputElement | null>(null)
    const parentWrapperRef = ref<HTMLInputElement | null>(null)

    const thePDF = ref<pdfjsApi.PDFDocumentProxy | null>(null)
    const numberOfPages = ref<number>(0)
    const currentPage = ref<number>(1)

    const eventBus = ref(null)

    const initPdfWorker = () => {
      loading.value = true
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJSWorker
      const loadingTask = pdfjsLib.getDocument(props.src)
      loadingTask.promise.then((pdf) => {
        ctx.emit('pdfLoaded', pdf)
        thePDF.value = pdf
        numberOfPages.value = pdf.numPages
        ctx.emit('totalPages', numberOfPages.value)
        if (props.page <= numberOfPages.value) {
          pdf.getPage(props.page).then((page) => renderPage(page))
        }
      })
    }

    const renderPage = (page: pdfjsApi.PDFPageProxy) => {

      loading.value = true

      const pdfWrapperEl = pdfWrapperRef.value as HTMLElement

      // Create a wrapper for each page
      const pageWrapper = document.createElement('div')
      pageWrapper.classList.add('vue-pdf__wrapper')
      pageWrapper.id = `vue-pdf-page-${props.page}`

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
      
      const pageWrapperStyles = window.getComputedStyle(pageWrapper)
      const pageWrapperWidth = parseFloat(pageWrapperStyles.width)

      const scale = pageWrapperWidth / initViewport.width
      const viewport = page.getViewport({scale})
      canvas.height = viewport.height
      canvas.width = viewport.width

      const context = canvas.getContext('2d')
      // Draw it on the canvas
      if (context) {
        page.render({ canvasContext: context, viewport }).promise.then(() => {
          
          // Render text layer for text selection
          if (props.enableTextSelection) {
            page.getTextContent().then((textContent) => {
              eventBus.value = new pdfjsViewer.EventBus()
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

              annotationLayer.style.cssText = `left: 0; top: 0; height: ${viewport.height}px; width: ${viewport.width}px;`

              // Render the annotation layer
              pdfjsLib.AnnotationLayer.render({
                viewport: viewport.clone({ dontFlip: true }),
                div: annotationLayer,
                annotations: annotationData,
                page: page,
                linkService: '',
                downloadManager: '',
                renderInteractiveForms: false
              })
            })
          }
          loading.value = false
          ctx.emit('pageLoaded', props.page)
        })
      }
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

