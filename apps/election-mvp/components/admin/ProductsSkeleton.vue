<template>
  <div class="products-skeleton">
    <div
      v-for="n in skeletonCount"
      :key="n"
      class="skeleton-item bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4"
    >
      <div class="flex items-center space-x-4">
        <!-- Image skeleton -->
        <div class="skeleton-image w-12 h-12 bg-gray-200 rounded-lg" />

        <!-- Content skeleton -->
        <div class="flex-1 space-y-2">
          <div class="skeleton-text h-4 bg-gray-200 rounded w-1/3" />
          <div class="skeleton-text h-3 bg-gray-200 rounded w-1/4" />
        </div>

        <!-- Price skeleton -->
        <div class="skeleton-text h-4 bg-gray-200 rounded w-20" />

        <!-- Status skeleton -->
        <div class="skeleton-text h-6 bg-gray-200 rounded-full w-16" />

        <!-- Actions skeleton -->
        <div class="flex space-x-2">
          <div class="skeleton-text h-8 bg-gray-200 rounded w-16" />
          <div class="skeleton-text h-8 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 6
})

const skeletonCount = computed(() => props.count)
</script>

<style scoped>
.skeleton-item {
  @apply animate-pulse;
}

.skeleton-image {
  animation-duration: 1.5s;
}

.skeleton-text {
  animation-duration: 1.5s;
}

/* Animation plus fluide */
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.skeleton-image,
.skeleton-text {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}
</style>