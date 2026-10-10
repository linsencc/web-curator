export function compactLayout(node) {
  const parent = node.parentElement;
  if (parent && (getComputedStyle(parent).display === 'grid' || parent.classList.contains('bf-compacted'))) parent.classList.toggle('bf-compacted', [...parent.children].some(child => child.classList.contains('bf-hidden')));
}

// The native loading sentinel can wrap a special skeleton. Keep its box for
// scroll detection, but take it out of grid placement when that child is hidden.
export function syncLoadingAnchors(root = document) {
  for (const anchor of root.querySelectorAll('.load-more-anchor')) {
    const children=[...anchor.children];
    const collapsed=children.length>0 && children.every(child=>child.classList.contains('bf-hidden'));
    anchor.classList.toggle('bf-load-sentinel',collapsed);
    const parent=anchor.parentElement;
    if(parent) parent.classList.toggle('bf-anchor-container',[...parent.children].some(child=>child.classList.contains('bf-load-sentinel')));
  }
}
