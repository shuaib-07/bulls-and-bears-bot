// Curved silhouettes with a deterministic triangular lattice, rather than coarse polygons.
const bull = "M112 199 C104 173 112 141 139 129 C166 116 193 129 214 113 C240 90 270 85 296 100 C316 90 342 98 359 118 L381 136 C397 142 408 158 410 174 L433 189 Q445 202 431 215 Q418 226 398 215 L375 200 Q368 237 340 248 L330 286 340 314 315 320 300 292 301 255 Q286 264 280 281 L276 318 247 318 253 275 269 236 Q238 248 208 235 L182 252 161 292 158 319 128 319 139 283 153 244 Q128 246 115 228 L94 268 80 304 81 318 52 318 60 292 79 248Z";
// Four-legged grizzly: raised muzzle, shoulder hump, long torso and planted paws.
const bear = "M931 319 L894 319 Q881 318 883 309 L895 294 Q882 274 872 249 L855 217 Q829 232 794 229 Q772 227 753 217 Q743 242 727 260 L716 298 Q738 302 738 314 Q734 320 720 320 L684 319 Q674 316 679 302 L687 257 Q688 220 678 191 Q653 180 635 161 L615 153 Q595 158 580 146 L567 131 Q564 125 571 123 L591 135 Q606 139 615 129 Q621 117 613 106 L600 99 578 101 Q566 100 565 89 Q561 80 569 75 L597 72 Q613 69 623 62 L638 60 Q641 41 652 45 Q663 46 663 64 L682 76 Q704 77 720 86 Q747 79 772 91 Q801 101 823 98 C858 92 889 100 908 125 Q934 156 934 190 Q935 227 918 248 L919 276 932 299 Q947 308 945 316Z";
const bearFarLegs = "M692 185 Q670 219 663 252 L636 295 Q614 298 615 309 Q620 316 642 315 L665 314 Q674 310 676 297 L706 259 735 204Z M822 216 Q810 248 822 270 L844 298 Q823 298 823 309 Q826 317 848 316 L870 314 Q878 309 868 296 L853 263 865 224Z";

// Slightly staggered and curved rows avoid the appearance of a flat square grid.
const mesh = Array.from({ length: 30 }, (_, row) =>
  Array.from({ length: 76 }, (_, col) => {
    const point = (r: number, c: number) => {
      const x = 40 + c * 12 + (r % 2) * 6 + Math.sin(c * 1.7 + r * .8) * 3;
      const y = 22 + r * 11 + Math.sin(c * .38 + r * .7) * 6;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    };
    return `M${point(row, col)}L${point(row, col + 1)}L${point(row + 1, col)}Z`;
  }).join("")
).join("");

export function BullBearClash() {
  return (
    <div className="clash-art" aria-hidden="true">
      <svg viewBox="0 0 1000 380" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="clash-copper" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#ffd2a0" /><stop offset=".45" stopColor="#ff843e" /><stop offset="1" stopColor="#a63613" />
          </linearGradient>
          <radialGradient id="clash-haze">
            <stop stopColor="#ff5f1f" stopOpacity=".12" /><stop offset="1" stopColor="#ff5f1f" stopOpacity="0" />
          </radialGradient>
          <clipPath id="bull-mesh-clip"><path d={bull} /></clipPath>
          <clipPath id="bear-mesh-clip"><path d={bear} /></clipPath>
          <clipPath id="bear-far-legs-clip"><path d={bearFarLegs} /></clipPath>
        </defs>
        <ellipse cx="500" cy="220" rx="460" ry="155" fill="url(#clash-haze)" />
        <g stroke="#ff5f1f" strokeOpacity=".14">
          <path d="M65 323H935M500 35V345M70 55V35H90M910 35H930V55" />
          <ellipse cx="500" cy="323" rx="400" ry="20" />
        </g>
        <g className="clash-bull" stroke="url(#clash-copper)" strokeWidth="1.4" strokeLinejoin="round">
          {/* Far horn, curled tail and far legs sit behind the muscular body. */}
          <path d="M336 124 Q297 88 320 51 Q315 83 363 107Z" fill="#251208" />
          <path d="M122 154 C72 139 68 92 94 91 C113 90 108 116 136 96 L151 80 146 101 Q132 124 113 114 C83 96 87 145 126 145" fill="#120b07" />
          <path d="M286 231 Q307 242 321 261 L346 271 356 258 372 263 363 290 Q354 300 340 292 L305 278 272 253Z" fill="#100b08" />
          <path d={bull} fill="#140c08" />
          <path d={mesh} clipPath="url(#bull-mesh-clip)" strokeWidth=".65" strokeOpacity=".62" />
          {/* Anatomical contours give the lattice volume at the shoulder and chest. */}
          <path d="M138 139 Q167 158 149 210M153 244Q171 216 190 205M189 137Q212 161 207 227M218 124Q251 154 242 231M265 105Q308 151 284 225M286 109Q331 121 333 176Q335 211 314 243M306 123Q316 172 301 211M330 129Q359 143 351 181L375 200M343 185Q328 221 340 248M208 235Q236 216 268 226M119 195Q145 202 160 187" strokeOpacity=".85" />
          <path d="M365 139 C388 138 419 113 429 83 Q438 126 389 158Z" fill="#241108" />
          <path d="M368 142L387 146 392 129 405 132 410 113 422 108M339 113L326 92 315 90M323 98L334 96" strokeWidth=".8" />
          <path d="M347 124Q356 97 374 107L367 135Z" fill="#201007" />
          <path d="M361 153Q374 148 382 159L372 164Z" fill="#ffb579" stroke="none" />
          <path d="M389 171Q377 188 398 215M409 176Q397 190 409 204M400 202Q414 211 433 204" />
          <ellipse cx="425" cy="194" rx="4" ry="3" fill="#ff9a57" stroke="none" />
          <path d="M56 309L79 309M131 308L158 308M249 309L276 309M316 310L335 306M65 310V318M143 309V319M261 310V318" />
        </g>
        <g className="clash-bear" stroke="url(#clash-copper)" strokeWidth="1.3" strokeLinejoin="round">
          <path d={bearFarLegs} fill="#0d0907" strokeOpacity=".55" />
          <path d={mesh} clipPath="url(#bear-far-legs-clip)" strokeWidth=".6" strokeOpacity=".3" />
          <path d={bear} fill="#170d08" />
          <path d={mesh} clipPath="url(#bear-mesh-clip)" strokeWidth=".65" strokeOpacity=".64" />
          {/* Long, connected contours describe the shoulder, rib cage and haunch. */}
          <g strokeWidth=".85" strokeOpacity=".8">
            <path d="M686 85 Q715 104 711 142 C705 168 697 191 704 218 L701 267 696 299M721 94 Q748 128 729 174 Q716 204 711 235M751 108 Q772 155 753 217M775 115 Q792 162 776 208M804 114 Q825 159 808 215M841 111 Q871 143 860 181 Q846 211 855 217M882 126 Q909 153 897 186 Q881 217 889 247L910 297" />
            <path d="M690 103 Q670 120 678 151 Q683 173 704 183M674 170 Q698 167 723 148M734 197 Q788 220 841 200M863 211 Q886 206 909 224M877 252 Q897 248 918 248" />
            <path d="M625 76 Q648 78 664 96 Q674 118 657 144L635 161M636 96 Q626 111 635 131M600 99L626 99M615 153Q636 146 644 132" />
          </g>
          {/* Open mouth and two visible canines make the raised head read as a roar. */}
          <path d="M578 101L587 103 587 115 581 109Z M611 135L607 124 602 134Z" fill="#ffce9b" strokeWidth=".65" />
          <path d="M566 80Q574 76 581 80L578 90 569 91Z" fill="#ff9b59" />
          <path d="M620 83L631 79 628 86 621 88Z" fill="#ffe1bc" stroke="none" />
          <path d="M646 61Q644 49 652 50Q659 52 657 63" stroke="#ffb577" />
          <path d="M681 307Q688 300 693 307M695 312Q701 303 706 310M710 313Q716 304 721 311M888 309Q895 302 900 310M902 313Q908 304 913 311M917 314Q923 306 929 312M621 307L631 304M637 309L648 305M830 309L840 306" stroke="#ffc28b" strokeWidth="1" strokeLinecap="round" />
        </g>
        <g className="clash-impact" stroke="#ff9b55">
          <circle cx="500" cy="200" r="47" strokeWidth="1.5" />
          <circle cx="500" cy="200" r="62" strokeOpacity=".3" strokeDasharray="2 8" />
          <path d="M500 125V95M500 275V305M425 200H395M575 200H605M447 147L426 126M553 147L574 126M447 253L426 274M553 253L574 274" strokeWidth="2" />
        </g>
        <g className="clash-labels" fill="#a3a3a3" fontFamily="monospace" fontSize="10" letterSpacing="3">
          <text x="120" y="365">01 / BULL · BUY PRESSURE</text>
          <text x="880" y="365" textAnchor="end">02 / BEAR · SELL PRESSURE</text>
        </g>
      </svg>
    </div>
  );
}
