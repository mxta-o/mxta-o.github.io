export type UIAnchor = {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  visible: boolean;
};

export const HIDDEN_ANCHOR: UIAnchor = {
  x: -9999,
  y: -9999,
  scale: 0.8,
  opacity: 0,
  visible: false
};
