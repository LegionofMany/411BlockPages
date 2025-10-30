declare module 'react-dom' {
  import React = require('react');
  export function createPortal(children: React.ReactNode, container: Element | DocumentFragment): React.ReactPortal;
}
