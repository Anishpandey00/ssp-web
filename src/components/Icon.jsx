const paths = {
  book: (
    <>
      <path d="M12 7c-3-3-7-3-9-2v14c3-1 6-1 9 2 3-3 6-3 9-2V5c-2-1-6-1-9 2Z" />
      <path d="M12 7v14" />
    </>
  ),
  arrow: (
    <>
      <path d="M4 12h16m-6-6 6 6-6 6" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12 4 4L19 6" />,
  list: (
    <>
      <path d="m3 6 1 1 2-2m-3 7 1 1 2-2m-3 7 1 1 2-2M10 6h11M10 12h11M10 18h11" />
    </>
  ),
  chart: (
    <>
      <path d="M4 4v16h16M8 15l4-5 4 2 5-7" />
    </>
  ),
  bookmark: <path d="M6 3h12v18l-6-4-6 4Z" />,
};
export default function Icon({ name = "book", ...props }) {
  return (
    <svg
      className="ui-icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.book}
    </svg>
  );
}
