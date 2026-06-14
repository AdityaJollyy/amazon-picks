import { Link } from "react-router-dom";

type WordmarkProps = {
  className?: string;
  /** Smile arrow under the wordmark. Hide it inside dense headers. */
  showArrow?: boolean;
};

/** "amazon picks" wordmark with the original orange smile-arrow.
 *  This is an original treatment — never the trademarked Amazon smile. */
export function Wordmark({ className = "", showArrow = true }: WordmarkProps) {
  return (
    <Link
      to="/"
      aria-label="Amazon Picks — go home"
      className={
        "flex shrink-0 flex-col items-start rounded-[4px] border border-transparent px-2 py-1.5 leading-none hover:border-white " +
        className
      }
    >
      <div className="flex items-baseline gap-[5px]">
        <span
          className="text-[25px] font-extrabold text-white"
          style={{ letterSpacing: "-1.2px" }}
        >
          amazon
        </span>
        <span
          className="text-[22px] font-extrabold text-[#febd69]"
          style={{ letterSpacing: "-0.5px" }}
        >
          picks
        </span>
      </div>
      {showArrow && (
        <svg
          width="86"
          height="11"
          viewBox="0 0 86 11"
          aria-hidden="true"
          style={{ marginTop: "-1px", marginLeft: "2px" }}
        >
          <path
            d="M2 3 Q 44 13 84 4"
            stroke="#ff9900"
            strokeWidth="2.6"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M80 2.5 L85 4 L80.5 7.5"
            stroke="#ff9900"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </Link>
  );
}
