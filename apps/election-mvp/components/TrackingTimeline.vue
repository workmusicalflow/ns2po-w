<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-6">
      {{ title }}
    </h3>
    <div class="space-y-6">
      <div
        v-for="(event, index) in events" 
        :key="index" 
        class="flex items-start"
      >
        <!-- Icône et ligne -->
        <div class="flex flex-col items-center">
          <div
            :class="[
              'flex items-center justify-center w-10 h-10 rounded-full text-lg',
              event.status === 'completed' ? 'bg-green-100 text-green-600' :
              event.status === 'current' ? 'bg-blue-100 text-blue-600' :
              'bg-gray-100 text-gray-400'
            ]"
          >
            {{ event.icon }}
          </div>
          <div
            v-if="index < events.length - 1" 
            :class="[
              'w-0.5 h-8 mt-2',
              event.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
            ]"
          />
        </div>
        
        <!-- Contenu -->
        <div class="ml-4 flex-1">
          <div class="flex items-center justify-between">
            <h4
              :class="[
                'font-medium',
                event.status === 'completed' ? 'text-green-900' :
                event.status === 'current' ? 'text-blue-900' :
                'text-gray-500'
              ]"
            >
              {{ event.title }}
            </h4>
            <span
              :class="[
                'text-sm',
                event.status === 'completed' ? 'text-green-600' :
                event.status === 'current' ? 'text-blue-600' :
                'text-gray-400'
              ]"
            >
              {{ event.date }}
            </span>
          </div>
          <p
            :class="[
              'text-sm mt-1',
              event.status === 'completed' ? 'text-green-700' :
              event.status === 'current' ? 'text-blue-700' :
              'text-gray-500'
            ]"
          >
            {{ event.description }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TrackingTimelineEvent } from '@ns2po/types'

interface Props {
  events: TrackingTimelineEvent[]
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Suivi de votre commande'
})
</script>