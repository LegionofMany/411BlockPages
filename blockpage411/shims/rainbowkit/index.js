"use strict";
const React = require('react');

function RainbowKitProvider({ children }) {
  return React.createElement(React.Fragment, null, children);
}

function ConnectButton() {
  return React.createElement('button', { className: 'px-3 py-1 rounded bg-emerald-500 text-black' }, 'Connect');
}

module.exports = {
  RainbowKitProvider,
  ConnectButton,
};
