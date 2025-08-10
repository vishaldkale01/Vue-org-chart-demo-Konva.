<template>
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
    @click="handleOverlayClick"
  >
    <div
      class="absolute top-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-slide-down"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {{ isEditMode ? 'Edit Node' : 'Add Node' }}
        </h2>
        <button
          class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          @click="$emit('cancel')"
          type="button"
        >
          <svg
            class="w-5 h-5 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="px-5 py-4">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Node Title -->
          <div>
            <label for="nodeTitle" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Node Title
            </label>
            <input
              id="nodeTitle"
              v-model="editableNode.title"
              type="text"
              class="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter node title"
              maxlength="100"
              required
              autofocus
            />
            <p class="text-xs text-gray-500 text-right">
              {{ editableNode.title.length }}/100
            </p>
          </div>

          <!-- Description -->
          <div>
            <label for="nodeDescription" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="nodeDescription"
              v-model="editableNode.description"
              rows="3"
              maxlength="500"
              class="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="Add a description..."
            ></textarea>
            <p class="text-xs text-gray-500 text-right">
              {{ (editableNode.description || '').length }}/500
            </p>
          </div>

          <!-- Background Color -->
          <div>
            <label for="nodeColor" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Background Color
            </label>
            <div class="flex items-center gap-3">
              <input
                id="nodeColor"
                v-model="editableNode.backgroundColor"
                type="color"
                class="w-10 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
              />
              <div
                class="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                :style="{ backgroundColor: editableNode.backgroundColor }"
              ></div>
              <span class="text-xs font-mono text-gray-600 dark:text-gray-300 uppercase">
                {{ editableNode.backgroundColor }}
              </span>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          class="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="handleSubmit"
        >
          {{ isEditMode ? 'Save Changes' : 'Add Node' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, computed, onUnmounted } from 'vue';

const props = defineProps({
  node: { type: Object, default: () => ({}) },
  mode: { type: String, default: 'add' } // 'add' or 'edit'
});
const emit = defineEmits(['save', 'cancel']);

const isEditMode = computed(() => props.mode === 'edit');

const editableNode = reactive({
  id: props.node.id || null,
  title: props.node.title || '',
  description: props.node.description || '',
  backgroundColor: props.node.backgroundColor || '#ffffff',
});

watch(
  () => props.node,
  (newNode) => {
    editableNode.id = newNode.id || null;
    editableNode.title = newNode.title || '';
    editableNode.description = newNode.description || '';
    editableNode.backgroundColor = newNode.backgroundColor || '#ffffff';
  },
  { immediate: true }
);

const handleSubmit = () => {
  if (editableNode.title.trim()) {
    emit('save', {
      id: editableNode.id,
      title: editableNode.title.trim(),
      description: editableNode.description.trim(),
      backgroundColor: editableNode.backgroundColor,
    });
  }
};

const handleOverlayClick = () => emit('cancel');
const handleKeyDown = (e) => e.key === 'Escape' && emit('cancel');

document.addEventListener('keydown', handleKeyDown);
onUnmounted(() => document.removeEventListener('keydown', handleKeyDown));
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slide-down {
  from { opacity: 0; transform: translateY(-15px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-fade-in {
  animation: fade-in 0.15s ease-out;
}
.animate-slide-down {
  animation: slide-down 0.2s ease-out;
}
</style>
