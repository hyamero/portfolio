type IconProps = React.HTMLAttributes<SVGElement>;

export const Icons = {
  adjust: (props: IconProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
      />
    </svg>
  ),

  openai: (props: IconProps) => (
    <svg
      width="100"
      height="100"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
    </svg>
  ),
  gmail: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      width="100"
      height="100"
      viewBox="0 0 48 48"
    >
      <path
        fill="#4caf50"
        d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z"
      ></path>
      <path
        fill="#1e88e5"
        d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z"
      ></path>
      <polygon
        fill="#e53935"
        points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"
      ></polygon>
      <path
        fill="#c62828"
        d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z"
      ></path>
      <path
        fill="#fbc02d"
        d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z"
      ></path>
    </svg>
  ),

  gitHub: (props: IconProps) => (
    <svg width="100" height="100" viewBox="0 0 438.549 438.549" {...props}>
      <path
        fill="currentColor"
        d="M409.132 114.573c-19.608-33.596-46.205-60.194-79.798-79.8-33.598-19.607-70.277-29.408-110.063-29.408-39.781 0-76.472 9.804-110.063 29.408-33.596 19.605-60.192 46.204-79.8 79.8C9.803 148.168 0 184.854 0 224.63c0 47.78 13.94 90.745 41.827 128.906 27.884 38.164 63.906 64.572 108.063 79.227 5.14.954 8.945.283 11.419-1.996 2.475-2.282 3.711-5.14 3.711-8.562 0-.571-.049-5.708-.144-15.417a2549.81 2549.81 0 01-.144-25.406l-6.567 1.136c-4.187.767-9.469 1.092-15.846 1-6.374-.089-12.991-.757-19.842-1.999-6.854-1.231-13.229-4.086-19.13-8.559-5.898-4.473-10.085-10.328-12.56-17.556l-2.855-6.57c-1.903-4.374-4.899-9.233-8.992-14.559-4.093-5.331-8.232-8.945-12.419-10.848l-1.999-1.431c-1.332-.951-2.568-2.098-3.711-3.429-1.142-1.331-1.997-2.663-2.568-3.997-.572-1.335-.098-2.43 1.427-3.289 1.525-.859 4.281-1.276 8.28-1.276l5.708.853c3.807.763 8.516 3.042 14.133 6.851 5.614 3.806 10.229 8.754 13.846 14.842 4.38 7.806 9.657 13.754 15.846 17.847 6.184 4.093 12.419 6.136 18.699 6.136 6.28 0 11.704-.476 16.274-1.423 4.565-.952 8.848-2.383 12.847-4.285 1.713-12.758 6.377-22.559 13.988-29.41-10.848-1.14-20.601-2.857-29.264-5.14-8.658-2.286-17.605-5.996-26.835-11.14-9.235-5.137-16.896-11.516-22.985-19.126-6.09-7.614-11.088-17.61-14.987-29.979-3.901-12.374-5.852-26.648-5.852-42.826 0-23.035 7.52-42.637 22.557-58.817-7.044-17.318-6.379-36.732 1.997-58.24 5.52-1.715 13.706-.428 24.554 3.853 10.85 4.283 18.794 7.952 23.84 10.994 5.046 3.041 9.089 5.618 12.135 7.708 17.705-4.947 35.976-7.421 54.818-7.421s37.117 2.474 54.823 7.421l10.849-6.849c7.419-4.57 16.18-8.758 26.262-12.565 10.088-3.805 17.802-4.853 23.134-3.138 8.562 21.509 9.325 40.922 2.279 58.24 15.036 16.18 22.559 35.787 22.559 58.817 0 16.178-1.958 30.497-5.853 42.966-3.9 12.471-8.941 22.457-15.125 29.979-6.191 7.521-13.901 13.85-23.131 18.986-9.232 5.14-18.182 8.85-26.84 11.136-8.662 2.286-18.415 4.004-29.263 5.146 9.894 8.562 14.842 22.077 14.842 40.539v60.237c0 3.422 1.19 6.279 3.572 8.562 2.379 2.279 6.136 2.95 11.276 1.995 44.163-14.653 80.185-41.062 108.068-79.226 27.88-38.161 41.825-81.126 41.825-128.906-.01-39.771-9.818-76.454-29.414-110.049z"
      />
    </svg>
  ),

  linkedIn: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      width="100"
      height="100"
      viewBox="0 0 48 48"
      {...props}
    >
      <path
        fill="#0078d4"
        d="M42,37c0,2.762-2.238,5-5,5H11c-2.761,0-5-2.238-5-5V11c0-2.762,2.239-5,5-5h26c2.762,0,5,2.238,5,5	V37z"
      ></path>
      <path
        d="M30,37V26.901c0-1.689-0.819-2.698-2.192-2.698c-0.815,0-1.414,0.459-1.779,1.364	c-0.017,0.064-0.041,0.325-0.031,1.114L26,37h-7V18h7v1.061C27.022,18.356,28.275,18,29.738,18c4.547,0,7.261,3.093,7.261,8.274	L37,37H30z M11,37V18h3.457C12.454,18,11,16.528,11,14.499C11,12.472,12.478,11,14.514,11c2.012,0,3.445,1.431,3.486,3.479	C18,16.523,16.521,18,14.485,18H18v19H11z"
        opacity=".05"
      ></path>
      <path
        d="M30.5,36.5v-9.599c0-1.973-1.031-3.198-2.692-3.198c-1.295,0-1.935,0.912-2.243,1.677	c-0.082,0.199-0.071,0.989-0.067,1.326L25.5,36.5h-6v-18h6v1.638c0.795-0.823,2.075-1.638,4.238-1.638	c4.233,0,6.761,2.906,6.761,7.774L36.5,36.5H30.5z M11.5,36.5v-18h6v18H11.5z M14.457,17.5c-1.713,0-2.957-1.262-2.957-3.001	c0-1.738,1.268-2.999,3.014-2.999c1.724,0,2.951,1.229,2.986,2.989c0,1.749-1.268,3.011-3.015,3.011H14.457z"
        opacity=".07"
      ></path>
      <path
        fill="#fff"
        d="M12,19h5v17h-5V19z M14.485,17h-0.028C12.965,17,12,15.888,12,14.499C12,13.08,12.995,12,14.514,12	c1.521,0,2.458,1.08,2.486,2.499C17,15.887,16.035,17,14.485,17z M36,36h-5v-9.099c0-2.198-1.225-3.698-3.192-3.698	c-1.501,0-2.313,1.012-2.707,1.99C24.957,25.543,25,26.511,25,27v9h-5V19h5v2.616C25.721,20.5,26.85,19,29.738,19	c3.578,0,6.261,2.25,6.261,7.274L36,36L36,36z"
      ></path>
    </svg>
  ),

  discord: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      width="100"
      height="100"
      viewBox="0 0 48 48"
    >
      <path
        fill="#8c9eff"
        d="M40,12c0,0-4.585-3.588-10-4l-0.488,0.976C34.408,10.174,36.654,11.891,39,14c-4.045-2.065-8.039-4-15-4s-10.955,1.935-15,4c2.346-2.109,5.018-4.015,9.488-5.024L18,8c-5.681,0.537-10,4-10,4s-5.121,7.425-6,22c5.162,5.953,13,6,13,6l1.639-2.185C13.857,36.848,10.715,35.121,8,32c3.238,2.45,8.125,5,16,5s12.762-2.55,16-5c-2.715,3.121-5.857,4.848-8.639,5.815L33,40c0,0,7.838-0.047,13-6C45.121,19.425,40,12,40,12z M17.5,30c-1.933,0-3.5-1.791-3.5-4c0-2.209,1.567-4,3.5-4s3.5,1.791,3.5,4C21,28.209,19.433,30,17.5,30z M30.5,30c-1.933,0-3.5-1.791-3.5-4c0-2.209,1.567-4,3.5-4s3.5,1.791,3.5,4C34,28.209,32.433,30,30.5,30z"
      ></path>
    </svg>
  ),

  ringStars: () => (
    <svg
      width={1440}
      height={810}
      viewBox="0 0 1440 810"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      // {...props}
    >
      <style>
        {
          "\n@keyframes fade {\n  to {\n    opacity: 1;\n    filter: blur(0px);\n  }\n}\n\n.ring-3 {\n  opacity: 0;\n  animation: fade 1s ease forwards;\n}\n\n.star {\n  opacity: 0;\n  filter: blur(2px);\n  animation: fade 1s ease forwards;\n}\n"
        }
      </style>
      <g opacity={0.5} clipPath="url(#clip0_1328_22)">
        <path
          style={{
            animationDelay: "0s",
          }}
          className="ring-3"
          d="M1256.21 404.604C1256.21 700.407 1016.14 940.204 720 940.204C423.859 940.204 183.791 700.407 183.791 404.604C183.791 108.801 423.859 -130.996 720 -130.996C1016.14 -130.996 1256.21 108.801 1256.21 404.604Z"
          stroke="url(#paint1_linear_1328_22)"
          strokeOpacity={0.1}
        />
        <path
          style={{
            animationDelay: "150ms",
          }}
          className="ring-3"
          d="M1148.87 413.296C1148.87 649.883 956.857 841.676 720 841.676C483.143 841.676 291.133 649.883 291.133 413.296C291.133 176.708 483.143 -15.0845 720 -15.0845C956.857 -15.0845 1148.87 176.708 1148.87 413.296Z"
          stroke="url(#paint2_linear_1328_22)"
          strokeOpacity={0.12}
        />
        <path
          style={{
            animationDelay: "250ms",
          }}
          className="ring-3"
          d="M1041.52 404.604C1041.52 581.975 897.572 725.764 719.998 725.764C542.424 725.764 398.473 581.975 398.473 404.604C398.473 227.233 542.424 83.4438 719.998 83.4438C897.572 83.4438 1041.52 227.233 1041.52 404.604Z"
          stroke="url(#paint3_linear_1328_22)"
          strokeOpacity={0.15}
        />
        <path
          style={{
            animationDelay: "350ms",
          }}
          className="ring-3"
          d="M934.184 404.604C934.184 522.759 838.291 618.544 720 618.544C601.709 618.544 505.816 522.759 505.816 404.604C505.816 286.448 601.709 190.664 720 190.664C838.291 190.664 934.184 286.448 934.184 404.604Z"
          stroke="url(#paint4_linear_1328_22)"
          strokeOpacity={0.2}
        />
        <path
          style={{
            animationDelay: "400ms",
          }}
          className="ring-3"
          d="M934.184 404.604C934.184 522.759 838.291 618.544 720 618.544C601.709 618.544 505.816 522.759 505.816 404.604C505.816 286.448 601.709 190.664 720 190.664C838.291 190.664 934.184 286.448 934.184 404.604Z"
          stroke="url(#paint5_linear_1328_22)"
          strokeOpacity={0.5}
        />
        <path
          style={{
            animationDelay: "450ms",
          }}
          className="ring-3"
          d="M934.184 404.604C934.184 522.759 838.291 618.544 720 618.544C601.709 618.544 505.816 522.759 505.816 404.604C505.816 286.448 601.709 190.664 720 190.664C838.291 190.664 934.184 286.448 934.184 404.604Z"
          stroke="url(#paint6_linear_1328_22)"
          strokeOpacity={0.6}
        />
        <g filter="url(#filter0_f_1328_22)">
          <path
            d="M934.184 404.604C934.184 522.759 838.291 618.544 720 618.544C601.709 618.544 505.816 522.759 505.816 404.604C505.816 286.448 601.709 190.664 720 190.664C838.291 190.664 934.184 286.448 934.184 404.604Z"
            stroke="url(#paint7_linear_1328_22)"
            strokeOpacity={0.2}
          />
          <path
            d="M934.184 404.604C934.184 522.759 838.291 618.544 720 618.544C601.709 618.544 505.816 522.759 505.816 404.604C505.816 286.448 601.709 190.664 720 190.664C838.291 190.664 934.184 286.448 934.184 404.604Z"
            stroke="url(#paint8_linear_1328_22)"
            strokeOpacity={0.5}
          />
        </g>
        <g
          className="star"
          opacity={0.5}
          style={{
            animationDelay: "500ms",
          }}
        >
          <rect
            opacity={0.9}
            width={1.09878}
            height={21.9755}
            transform="matrix(0.707163 -0.70705 0.707163 0.70705 510.492 323.196)"
            fill="url(#paint9_linear_1328_22)"
          />
          <rect
            opacity={0.9}
            width={1.09878}
            height={21.9755}
            transform="matrix(0.707163 0.70705 0.707163 -0.70705 510.492 337.957)"
            fill="url(#paint10_linear_1328_22)"
          />
          <ellipse
            cx={518.65}
            cy={330.576}
            rx={1.09886}
            ry={1.09869}
            fill="white"
          />
        </g>
      </g>
      <g
        className="star"
        style={{
          animationDelay: "700ms",
        }}
      >
        <rect
          opacity={0.9}
          x={587.539}
          y={228.853}
          width={1.0775}
          height={21.5499}
          transform="rotate(-90 587.539 228.853)"
          fill="url(#paint11_linear_1328_22)"
        />
        <rect
          opacity={0.9}
          width={1.0775}
          height={21.5499}
          transform="matrix(1 0 0 -1 597.779 239.09)"
          fill="url(#paint12_linear_1328_22)"
        />
        <circle
          cx={598.313}
          cy={228.315}
          r={1.0775}
          transform="rotate(-45 598.313 228.315)"
          fill="white"
        />
      </g>
      <g
        className="star"
        opacity={0.7}
        style={{
          animationDelay: "600ms",
        }}
      >
        <rect
          opacity={0.9}
          x={788.971}
          y={206.371}
          width={0.94276}
          height={18.8552}
          transform="rotate(-90 788.971 206.371)"
          fill="url(#paint13_linear_1328_22)"
        />
        <rect
          opacity={0.9}
          width={0.94276}
          height={18.8552}
          transform="matrix(1 0 0 -1 797.928 215.327)"
          fill="url(#paint14_linear_1328_22)"
        />
        <circle
          cx={798.398}
          cy={205.9}
          r={0.94276}
          transform="rotate(-45 798.398 205.9)"
          fill="white"
        />
      </g>
      <g
        className="star"
        opacity={0.5}
        style={{
          animationDelay: "800ms",
        }}
      >
        <rect
          opacity={0.9}
          x={928}
          y={392.571}
          width={0.808122}
          height={16.1624}
          transform="rotate(-45 928 392.571)"
          fill="url(#paint15_linear_1328_22)"
        />
        <rect
          opacity={0.9}
          width={0.808122}
          height={16.1624}
          transform="matrix(0.707107 0.707107 0.707107 -0.707107 928 403.429)"
          fill="url(#paint16_linear_1328_22)"
        />
        <circle cx={934} cy={398} r={0.808122} fill="white" />
      </g>
      <defs>
        <filter
          id="filter0_f_1328_22"
          x={475.316}
          y={160.164}
          width={489.367}
          height={488.88}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation={15}
            result="effect1_foregroundBlur_1328_22"
          />
        </filter>
        <radialGradient
          id="paint0_radial_1328_22"
          cx={0}
          cy={0}
          r={1}
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(720 364) rotate(80.3639) scale(379.352 675.064)"
        >
          <stop stopOpacity={0} />
          <stop offset={1} />
        </radialGradient>
        <linearGradient
          id="paint1_linear_1328_22"
          x1={720}
          y1={-131.496}
          x2={720}
          y2={940.704}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop offset={1} stopColor="white" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint2_linear_1328_22"
          x1={720}
          y1={-15.5845}
          x2={720}
          y2={842.176}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop offset={1} stopColor="#8D8D8D" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint3_linear_1328_22"
          x1={719.998}
          y1={82.9438}
          x2={719.998}
          y2={726.264}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop offset={1} stopColor="white" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint4_linear_1328_22"
          x1={720}
          y1={190.164}
          x2={720}
          y2={525.854}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop offset={1} stopColor="white" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint5_linear_1328_22"
          x1={720}
          y1={190.164}
          x2={739.981}
          y2={264.235}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop offset={1} stopColor="white" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint6_linear_1328_22"
          x1={720}
          y1={190.164}
          x2={724.341}
          y2={205.127}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop offset={1} stopColor="white" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint7_linear_1328_22"
          x1={720}
          y1={190.164}
          x2={720}
          y2={525.854}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop offset={1} stopColor="white" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint8_linear_1328_22"
          x1={720}
          y1={190.164}
          x2={739.981}
          y2={264.235}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop offset={1} stopColor="white" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint9_linear_1328_22"
          x1={0.549388}
          y1={0}
          x2={0.549388}
          y2={21.9755}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity={0} />
          <stop offset={0.5} stopColor="white" />
          <stop offset={1} stopColor="white" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint10_linear_1328_22"
          x1={0.549388}
          y1={0}
          x2={0.549388}
          y2={21.9755}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity={0} />
          <stop offset={0.5} stopColor="white" />
          <stop offset={1} stopColor="white" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint11_linear_1328_22"
          x1={588.078}
          y1={228.853}
          x2={588.078}
          y2={250.403}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity={0} />
          <stop offset={0.5} stopColor="white" />
          <stop offset={1} stopColor="white" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint12_linear_1328_22"
          x1={0.538748}
          y1={0}
          x2={0.538748}
          y2={21.5499}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity={0} />
          <stop offset={0.5} stopColor="white" />
          <stop offset={1} stopColor="white" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint13_linear_1328_22"
          x1={789.442}
          y1={206.371}
          x2={789.442}
          y2={225.226}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity={0} />
          <stop offset={0.5} stopColor="white" />
          <stop offset={1} stopColor="white" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint14_linear_1328_22"
          x1={0.47138}
          y1={0}
          x2={0.47138}
          y2={18.8552}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity={0} />
          <stop offset={0.5} stopColor="white" />
          <stop offset={1} stopColor="white" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint15_linear_1328_22"
          x1={928.404}
          y1={392.571}
          x2={928.404}
          y2={408.734}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity={0} />
          <stop offset={0.5} stopColor="white" />
          <stop offset={1} stopColor="white" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id="paint16_linear_1328_22"
          x1={0.404061}
          y1={0}
          x2={0.404061}
          y2={16.1624}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity={0} />
          <stop offset={0.5} stopColor="white" />
          <stop offset={1} stopColor="white" stopOpacity={0} />
        </linearGradient>
        <clipPath id="clip0_1328_22">
          <rect width={1440} height={809.208} fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
};
