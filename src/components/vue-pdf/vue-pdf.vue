<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js'
import PDFJSWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry'
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/types/display/api'

export default defineComponent({
  name: 'vue-pdf',

  props: {
    pdf: {
      type: String,
      required: true
    }
  },
  setup(props, ctx) {

    const loading = ref<boolean>(false)

    const pdfWrapperRef = ref<HTMLInputElement | null>(null)
    const parentWrapperRef = ref<HTMLInputElement | null>(null)

    const thePDF = ref<PDFDocumentProxy | null>(null)
    const numberOfPages = ref<number>(0)
    const currentPage = ref<number>(1)

    const initPdfWorker = () => {
      const loadingTask = pdfjsLib.getDocument(props.pdf)
      loadingTask.promise.then((pdf) => {
        ctx.emit('pdf-loaded')
        thePDF.value = pdf
        numberOfPages.value = pdf.numPages
        ctx.emit('numberOfPages', numberOfPages.value)
        // Start with first page
        pdf.getPage(currentPage.value).then((page) => renderPages(page))
      })
    }

    const renderPages = (page: PDFPageProxy) => {

      const pdfWrapperEl = pdfWrapperRef.value as HTMLElement

      // We'll create a wrapper and an annotation layer for each page
      const canvasWrapper = document.createElement('div')
      canvasWrapper.classList.add('vue-pdf__wrapper')

      const annotationLayer = document.createElement('div')
      annotationLayer.classList.add('vue-pdf__wrapper-annotation-layer')

      // Create a canvas element for each page to draw on
      const canvas = document.createElement('canvas')
      canvas.id = `pdf-canvas-page-${currentPage.value}`

      canvasWrapper.appendChild(canvas)
      canvasWrapper.appendChild(annotationLayer)
      pdfWrapperEl?.appendChild(canvasWrapper)

      // This gives us the page's dimensions at full scale
      const initViewport = page.getViewport({ scale: 1 } )
      
      const canvasWrapperStyles = window.getComputedStyle(canvasWrapper)
      const canvasWrapperWidth = parseFloat(canvasWrapperStyles.width)

      const scale = canvasWrapperWidth / initViewport.width
      const viewport = page.getViewport({scale})
      canvas.height = viewport.height
      canvas.width = viewport.width

      const context = canvas.getContext('2d')
      // Draw it on the canvas
      if (context) {
        page
          .render({ canvasContext: context, viewport })
          .promise.then(() => page.getAnnotations())
          .then((annotationData) => {

            // Canvas offset
            const canvasOffsetLeft = (canvasWrapper as HTMLElement).offsetLeft;
            const canvasOffsetTop = (canvasWrapper as HTMLElement).offsetTop;

            annotationLayer.style.cssText = `left: ${canvasOffsetLeft}px; top: ${canvasOffsetTop}px; height: ${viewport.height}px; width: ${viewport.width}px;`;

            // Render the annotation layer
            pdfjsLib.AnnotationLayer.render({
              viewport: viewport.clone({ dontFlip: true }),
              div: annotationLayer as any,
              annotations: annotationData,
              page: page,
              linkService: '',
              downloadManager: '',
              renderInteractiveForms: false
            });
          });
      }
      ctx.emit('page-loaded', currentPage.value)
      // Move to next page
      currentPage.value++;
      if (currentPage.value > numberOfPages.value) {
        // All pages have been loaded and rendered
        loading.value = false;
      }
      if (thePDF.value && currentPage.value <= numberOfPages.value) {
        thePDF.value.getPage(currentPage.value).then((page) => renderPages(page));
      }
    }

    onMounted(() => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJSWorker
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
    padding: 20px;

    &-annotation-layer {
      position: absolute;
      .linkAnnotation {
        position: absolute;

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

