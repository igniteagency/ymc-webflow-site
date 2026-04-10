const handleExternalLinks = (): void => {
  const externalLinks = document.querySelectorAll<HTMLAnchorElement>(
    `
      a[data-external="yes"],
      a[data-external="true"],
      a[data-external="1"],
      [data-external="yes"] a,
      [data-external="true"] a,
      [data-external="1"] a
    `
  );

  externalLinks.forEach((link) => {
    link.setAttribute('target', '_blank');
  });
};

export default handleExternalLinks;
