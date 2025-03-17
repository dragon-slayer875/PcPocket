export { }
declare global {
  interface Window {
    androidBackCallback?: function(): boolean;
  }
}
