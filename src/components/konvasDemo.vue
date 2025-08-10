<template>
  <v-stage
    ref="stageRef"
    :config="stageConfig"
    @wheel="handleWheel"
  >
    <v-layer ref="linksLayer">
      <v-line
        v-for="connection in connections"
        :key="`link-${connection.from}-${connection.to}`"
        :config="connection.config"
      />
    </v-layer>
    <v-layer ref="nodesLayer">
      <v-group
        v-for="node in visibleNodes"
        :key="`node-${node.id}`"
        :config="{ x: node.x, y: node.y }"
      >
        <!-- Node background -->
        <v-rect :config="getNodeBackgroundConfig(node)" />
        
        <!-- Node title -->
        <v-text :config="getNodeTitleConfig(node)" />
        <v-text :config="getNodeRoleConfig(node)" />
        
        <!-- Collapse/Expand button -->
        <v-text 
          :config="getCollapseButtonConfig(node)"
          @click="toggleCollapse(node.id)"
        />
        
        <!-- Add child button -->
        <v-text 
          :config="getAddButtonConfig()"
          @click="addNode(node.id)"
        />
        
        <!-- Edit button -->
        <v-text 
          :config="getEditButtonConfig()" 
          @click="openEditModal(node)"
        />
        
        <!-- Delete button -->
        <v-text 
          :config="getDeleteButtonConfig()"
          @click="deleteNode(node.id)"
        />
      </v-group>
    </v-layer>
  </v-stage>

  <!-- Edit Modal -->
  <EditNodeModal 
    v-if="editModal.isOpen"
    :node="editModal.node"
    :mode="toggleMode"
    @save="handleSaveNode"
    @cancel="closeEditModal"
  />
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import EditNodeModal from './EditNodeModal.vue';

// Configuration constants
const CONFIG = {
  NODE_WIDTH: 500,
  NODE_HEIGHT: 260,
  LEVEL_VERTICAL_SPACING: 100,
  SIBLING_HORIZONTAL_SPACING: 60,
  ZOOM_SCALE_FACTOR: 1.01,
  NODE_CORNER_RADIUS: 20,
  LINE_STROKE_WIDTH: 2,
};

const COLORS = {
  NODE_FILL: '#fff',
  NODE_STROKE: 'black',
  LINE_STROKE: 'black',
  COLLAPSE_BUTTON: 'blue',
  ADD_BUTTON: 'green',
  DELETE_BUTTON: 'red',
  EDIT_BUTTON: 'red',
};

// Reactive state
const state = reactive({
  nodes: {},
  rootIds: [],
  nodeIdCounter: 1,
  collapsed: {},
});

// Modal state
const editModal = reactive({
  isOpen: false,
  node: null,
});

// Refs
const stageRef = ref(null);
const linksLayer = ref(null);
const nodesLayer = ref(null);
const toggleMode =ref('edit')

// Stage configuration
const width = window.innerWidth;
const height = window.innerHeight;

const stageConfig = computed(() => ({
  width,
  height,
  draggable: true,
}));

// Computed properties for rendering
const visibleNodes = computed(() => {
  return Object.values(state.nodes).filter(node => !isHiddenByCollapse(node.id));
});

const connections = computed(() => {
  const links = [];
  Object.values(state.nodes).forEach(node => {
    if (shouldDrawConnection(node)) {
      const parent = state.nodes[node.parentId];
      links.push({
        from: parent.id,
        to: node.id,
        config: {
          points: [
            parent.x + CONFIG.NODE_WIDTH / 2, 
            parent.y + CONFIG.NODE_HEIGHT,
            node.x + CONFIG.NODE_WIDTH / 2, 
            node.y
          ],
          stroke: COLORS.LINE_STROKE,
          strokeWidth: CONFIG.LINE_STROKE_WIDTH,
        }
      });
    }
  });
  return links;
});

// Node configuration functions
const getNodeBackgroundConfig = (node) => ({
  width: CONFIG.NODE_WIDTH,
  height: CONFIG.NODE_HEIGHT,
  fill: node.backgroundColor || COLORS.NODE_FILL,
  stroke: COLORS.NODE_STROKE,
  cornerRadius: CONFIG.NODE_CORNER_RADIUS,
});

const getNodeTitleConfig = (node = {}) => ({
  text: node?.title,
  width: CONFIG.NODE_WIDTH ,
  x : 40,
  y : 10,
  height: CONFIG.NODE_HEIGHT,
  align: 'left',
  verticalAlign: 'center',
  padding: 10,
});

const getNodeRoleConfig = (node) => ({
  text: "Responsibility and Roles \n" ,
  width: CONFIG.NODE_WIDTH ,
  x : getNodeTitleConfig().x + 0,
  y : getNodeTitleConfig().y + 50,
  height: CONFIG.NODE_HEIGHT,
  align: 'left',
  verticalAlign: 'center',
  padding: 10,
});

const getCollapseButtonConfig = (node) => ({
  text: state.collapsed[node.id] ? '+' : '-',
  x: CONFIG.NODE_WIDTH / 2 - 5,
  y: CONFIG.NODE_HEIGHT - 20,
  fontSize: 18,
  fill: COLORS.COLLAPSE_BUTTON,
});

const getAddButtonConfig = () => ({
  text: '+',
  x: CONFIG.NODE_WIDTH - 20,
  y: CONFIG.NODE_HEIGHT - 20,
  fontSize: 18,
  fill: COLORS.ADD_BUTTON,
});

const getEditButtonConfig = () => ({
  text: '✏️',
  x: CONFIG.NODE_WIDTH - 20,
  y: 10,
  fontSize: 10,
  fill: COLORS.EDIT_BUTTON,
});

const getDeleteButtonConfig = () => ({
  text: 'x',
  x: 20,
  y: CONFIG.NODE_HEIGHT - 20,
  fontSize: 18,
  fill: COLORS.DELETE_BUTTON,
});

// Node management functions
const addNode = (parentId = null) => {

      toggleMode.value = 'add';
  editModal.node = {
    id: null, // new node, so no ID yet
    parentId,
    title: '',
    backgroundColor: COLORS.NODE_FILL,
    children: []
  };
  editModal.isOpen = true;
  return
  const id = state.nodeIdCounter++;
  const newNode = {
    id,
    title: `Node ${id}`,
    parentId,
    children: [],
    x: 0,
    y: 0,
  };

  state.nodes[id] = newNode;

  if (parentId) {
    state.nodes[parentId].children.push(id);
  } else {
    state.rootIds.push(id);
  }

  updateLayout();
  return newNode;
};

const deleteNode = (id) => {
  const node = state.nodes[id];
  if (!node) return;

  // Remove from parent's children or root
  if (node.parentId) {
    const parent = state.nodes[node.parentId];
    parent.children = parent.children.filter(childId => childId !== id);
  } else {
    state.rootIds = state.rootIds.filter(rootId => rootId !== id);
  }

  // Recursively delete children
  node.children.forEach(childId => deleteNode(childId));

  // Clean up node data
  delete state.nodes[id];
  delete state.collapsed[id];

  updateLayout();
};

// Modal functions
const openEditModal = (node) => {
  editModal.node = { ...node }; // Create a copy to avoid direct mutation
  editModal.isOpen = true;
};

const closeEditModal = () => {
  editModal.isOpen = false;
  editModal.node = null;
};

const handleSaveNode = (updatedNode) => {
  // Update the node in state
  state.nodes[updatedNode.id] = { ...state.nodes[updatedNode.id], ...updatedNode };
  closeEditModal();
};



const toggleCollapse = (id) => {
  state.collapsed[id] = !state.collapsed[id];
  updateLayout();
};

const isHiddenByCollapse = (id) => {
  let currentNode = state.nodes[id];
  while (currentNode?.parentId) {
    if (state.collapsed[currentNode.parentId]) {
      return true;
    }
    currentNode = state.nodes[currentNode.parentId];
  }
  return false;
};

const shouldDrawConnection = (node) => {
  return (
    node.parentId &&
    !isHiddenByCollapse(node.id) &&
    !state.collapsed[node.parentId]
  );
};

// Layout functions
const updateLayout = () => {
  let yOffset = 50;
  
  state.rootIds.forEach(rootId => {
    const { width } = measureSubtree(rootId);
    const startX = (width - width) / 2;
    positionSubtree(rootId, startX, yOffset);
  });
};

const measureSubtree = (nodeId) => {
  const node = state.nodes[nodeId];
  const hasVisibleChildren = node.children.length && !state.collapsed[nodeId];
  
  if (!hasVisibleChildren) {
    return { 
      width: CONFIG.NODE_WIDTH, 
      height: CONFIG.NODE_HEIGHT 
    };
  }

  let totalChildWidth = 0;
  node.children.forEach(childId => {
    const { width } = measureSubtree(childId);
    totalChildWidth += width + CONFIG.SIBLING_HORIZONTAL_SPACING;
  });
  
  totalChildWidth -= CONFIG.SIBLING_HORIZONTAL_SPACING;

  return {
    width: Math.max(totalChildWidth, CONFIG.NODE_WIDTH),
    height: CONFIG.NODE_HEIGHT + CONFIG.LEVEL_VERTICAL_SPACING,
  };
};

const positionSubtree = (nodeId, x, y) => {
  const node = state.nodes[nodeId];
  const { width } = measureSubtree(nodeId);
  
  node.x = x + width / 2 - CONFIG.NODE_WIDTH / 2;
  node.y = y;

  const hasVisibleChildren = node.children.length && !state.collapsed[nodeId];
  if (!hasVisibleChildren) return;

  let totalChildWidth = 0;
  node.children.forEach(childId => {
    const { width: childWidth } = measureSubtree(childId);
    totalChildWidth += childWidth + CONFIG.SIBLING_HORIZONTAL_SPACING;
  });
  totalChildWidth -= CONFIG.SIBLING_HORIZONTAL_SPACING;

  let currentX = x + (width - totalChildWidth) / 2;
  const childY = y + CONFIG.NODE_HEIGHT + CONFIG.LEVEL_VERTICAL_SPACING;

  node.children.forEach(childId => {
    const { width: childWidth } = measureSubtree(childId);
    positionSubtree(childId, currentX, childY);
    currentX += childWidth + CONFIG.SIBLING_HORIZONTAL_SPACING;
  });
};

// Zoom and pan handling
const handleWheel = (e) => {
  e.evt.preventDefault();
  
  const stage = stageRef.value.getNode();
  const oldScale = stage.scaleX();
  const pointer = stage.getPointerPosition();
  
  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  };

  let direction = e.evt.deltaY > 0 ? 1 : -1;

  if (e.evt.ctrlKey) {
    direction = -direction;
  }

  const newScale = direction > 0 ? oldScale * CONFIG.ZOOM_SCALE_FACTOR : oldScale / CONFIG.ZOOM_SCALE_FACTOR;

  stage.scale({ x: newScale, y: newScale });

  const newPos = {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  };
  stage.position(newPos);
};

// Initialize
onMounted(() => {
  addNode(); // Create initial root node
});
</script>