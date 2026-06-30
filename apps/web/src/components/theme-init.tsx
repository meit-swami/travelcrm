// Applies the saved colour palette before first paint to avoid a flash of the
// default theme. Rendered in <head>; runs synchronously from localStorage.
export function ThemeInit() {
  const js = `(function(){try{var t=localStorage.getItem('travelos-theme');if(t&&t!=='default'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
