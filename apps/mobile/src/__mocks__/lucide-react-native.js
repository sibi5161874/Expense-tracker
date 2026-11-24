const React = require("react");
const { View } = require("react-native");

module.exports = new Proxy(
  {},
  {
    get: (_target, prop) => {
      const MockIcon = (props) =>
        React.createElement(View, { ...props, testID: `icon-${String(prop)}` });
      MockIcon.displayName = String(prop);
      return MockIcon;
    },
  }
);
