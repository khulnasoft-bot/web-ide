# packages/cross-origin-channel

This package handles bi-directional communication between the Web IDE origin and the GitLab rails
application origin. The communication between both origins happens securely via the [`postMessage`]
(https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) API and the [`MessageChannel`]
(https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel) API. This package contains two classes
that use the aforementioned APIs to send messages between the two origins:

`DefaultWindowChannel`

This class accepts two `Window` objects and handles communication between them. Each `Window` object represents an origin.

1. `localWindow` represents the current execution context.
2. `remoteWindow` represents the external execution context that we are communicating with.
3. `remoteWindowOrigin` The URL that represents the origin expected for the `remoteWindow`.

For example, let's say that we have a web page with an iframe embedded. If we create a
`DefaultWindowChannel` object in the web page's execution context, `localWindow` would be the page's
global `window` object and `remoteWindow` would be the iframe's `contentWindow` property. Conversely, if
I create the object in the iframe's execution context, the `localWindow` will be the iframe's `window`
object and `remoteWindow` will be the `window.parent` property. In real use cases, both execution contexts
create their own instances of `DefaultWindowChannel` to send and receive messages.

You can invoke the `postMessage` method to send messages from the `localWindow` to the `remoteWindow`. Use
`waitForMessage` to obtain a promise that is resolved when `localWindow` receives a message from
`remoteWindow`.

`DefaultPortChannel`

You create a secondary channel using the `DefaultWindowChannel`'s `createPortChannel(portName)` method
which returns an instance of `DefaultPortChannel`. `DefaultPortChannel` wraps a [`MessagePort`](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort) object. Since a `MessageChannel` exposes two ports,
the first port is available in the window that created the port channel. The 2nd port can be requested by
a remote window using the `requestPortChannel(portName)`.
