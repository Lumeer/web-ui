/* SystemJS module definition */
declare var module: NodeModule;
declare var Plotly: any;
interface NodeModule {
  id: string;
}

declare module '*.json' {
  const value: any;
  export default value;
}
