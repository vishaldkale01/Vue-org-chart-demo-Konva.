<template>
  <div id="container"></div>
</template>

<script setup>
import { onMounted, reactive } from 'vue';
import Konva from 'konva';

const state = reactive({
  nodes: {},
  rootIds: [],
  nodeIdCounter: 1,
  collapsed: {},
});

const NODE_W = 460;
const NODE_H = 160;
const LEVEL_V_SPACING = 100;
const SIBLING_H_SPACING = 60;

let stage, linksLayer, nodesLayer;

function addNode(parentId = null) {
  const id = state.nodeIdCounter++;
  state.nodes[id] = {
    id,
    title: `Node ${id}`,
    parentId,
    children: [],
    x: 0,
    y: 0,
  };
  if (parentId) {
    state.nodes[parentId].children.push(id);
  } else {
    state.rootIds.push(id);
  }
  updateLayout();
}

function deleteNode(id) {
  const node = state.nodes[id];
  if (!node) return;
  if (node.parentId) {
    state.nodes[node.parentId].children = state.nodes[node.parentId].children.filter(cid => cid !== id);
  } else {
    state.rootIds = state.rootIds.filter(rid => rid !== id);
  }
  node.children.forEach(cid => deleteNode(cid));
  delete state.nodes[id];
  updateLayout();
}

function toggleCollapse(id) {
  state.collapsed[id] = !state.collapsed[id];
  updateLayout();
}

function isHiddenByCollapse(id) {
  let current = state.nodes[id];
  while (current.parentId) {
    if (state.collapsed[current.parentId]) return true;
    current = state.nodes[current.parentId];
  }
  return false;
}

function updateLayout() {
  let y = 50;
  state.rootIds.forEach(rid => {
    const { width } = measureSubtree(rid);
    const startX = (stage.width() - width) / 2;
    positionSubtree(rid, startX, y);
  });
  render();
}

function measureSubtree(id) {
  const node = state.nodes[id];
  if (!node.children.length || state.collapsed[id]) return { width: NODE_W, height: NODE_H };
  let totalWidth = 0;
  node.children.forEach(cid => {
    const { width } = measureSubtree(cid);
    totalWidth += width + SIBLING_H_SPACING;
  });
  totalWidth -= SIBLING_H_SPACING;
  return { width: Math.max(totalWidth, NODE_W), height: NODE_H + LEVEL_V_SPACING };
}

function positionSubtree(id, x, y) {
  const node = state.nodes[id];
  const { width } = measureSubtree(id);
  node.x = x + width / 2 - NODE_W / 2;
  node.y = y;

  if (node.children.length && !state.collapsed[id]) {
    let totalWidth = 0;
    node.children.forEach(cid => {
      const { width: cWidth } = measureSubtree(cid);
      totalWidth += cWidth + SIBLING_H_SPACING;
    });
    totalWidth -= SIBLING_H_SPACING;

    let startX = x + (width - totalWidth) / 2;
    node.children.forEach(cid => {
      const { width: cWidth } = measureSubtree(cid);
      positionSubtree(cid, startX, y + NODE_H + LEVEL_V_SPACING);
      startX += cWidth + SIBLING_H_SPACING;
    });
  }
}

function render() {
  linksLayer.destroyChildren();
  nodesLayer.destroyChildren();

  Object.values(state.nodes).forEach(node => {
    if (isHiddenByCollapse(node.id)) return;

    if (node.parentId && !isHiddenByCollapse(node.id) && !state.collapsed[node.parentId]) {
      const parent = state.nodes[node.parentId];
      linksLayer.add(new Konva.Line({
        points: [parent.x + NODE_W / 2, parent.y + NODE_H, node.x + NODE_W / 2, node.y],
        stroke: 'black',
        strokeWidth: 2,
      }));
    }

    const group = new Konva.Group({ x: node.x, y: node.y });
    group.add(new Konva.Rect({
      width: NODE_W,
      height: NODE_H,
      fill: '#fff',
      stroke: 'black',
      cornerRadius: 20,
    }));
    group.add(new Konva.Text({
      text: node.title,
      width: NODE_W,
      height: NODE_H,
      align: 'center',
      verticalAlign: 'middle',
      padding: 10,
    }));

    const collapseBtn = new Konva.Text({
      text: state.collapsed[node.id] ? '+' : '-',
      x: NODE_W / 2 - 5,
      y: NODE_H - 20,
      fontSize: 18,
      fill: 'blue',
    });
    collapseBtn.on('click', () => toggleCollapse(node.id));
    group.add(collapseBtn);

    const addBtn = new Konva.Text({
      text: '+',
      x: NODE_W - 20,
      y: NODE_H - 20,
      fontSize: 18,
      fill: 'green',
    });
    addBtn.on('click', () => addNode(node.id));
    group.add(addBtn);

    const delBtn = new Konva.Text({
      text: 'x',
      x: 5,
      y: NODE_H - 20,
      fontSize: 18,
      fill: 'red',
    });
    delBtn.on('click', () => deleteNode(node.id));
    group.add(delBtn);

    nodesLayer.add(group);
  });
  linksLayer.draw();
  nodesLayer.draw();
}

onMounted(() => {
  stage = new Konva.Stage({ container: 'container', width: window.innerWidth, height: window.innerHeight });
  linksLayer = new Konva.Layer();
  nodesLayer = new Konva.Layer();
  stage.add(linksLayer, nodesLayer);
  addNode();
});
</script>
