export const routeAngles=[66,52,32,14,7,1,-6];
export type DetailView={image:string;path:string;interior?:boolean};
// These paths follow visible panel seams and upholstery contours in the reference images.
const windshield='M331 146 Q390 137 453 146 L473 190 Q392 196 309 190 Z';
const frontWheel='M575 268 A30 43 0 1 1 515 268 A30 43 0 1 1 575 268 Z';
const backWheel='M279 267 A30 43 0 1 1 219 267 A30 43 0 1 1 279 267 Z';
export const exteriorPaths:Record<string,string>={
 'quick-vin':windshield,
 'route-windshield-outside':windshield+' M289 201 Q319 197 339 202 L337 224 Q310 231 289 222 Z M450 202 Q474 197 496 202 L496 222 Q472 230 451 224 Z',
 'route-passenger-front':'M373 151 Q428 148 470 155 L491 188 Q558 185 611 211 L626 234 L623 276 L580 277 Q578 226 548 224 Q507 221 506 276 L374 276 Z '+frontWheel,
 'route-passenger-rear':'M184 159 Q221 144 277 145 L369 150 L369 276 L288 276 Q284 224 249 225 Q214 224 210 277 L181 271 L177 197 Z '+backWheel,
 'route-driver-front':'M317 151 Q361 146 423 150 L423 276 L291 277 Q287 224 249 225 Q211 224 209 277 L176 273 L173 223 Q209 193 289 189 Z M278 269 A30 42 0 1 1 218 269 A30 42 0 1 1 278 269 Z',
 'route-driver-rear':'M428 150 L515 150 Q568 148 608 165 L624 204 L623 273 L584 277 Q580 225 547 225 Q510 223 506 277 L428 277 Z M576 268 A30 43 0 1 1 516 268 A30 43 0 1 1 576 268 Z',
 'quick-charge-door':'M582 195 Q602 194 611 199 L612 220 Q601 225 582 222 Z',
};
const dashboardScreen='M590 181 Q586 181 586 193 L586 295 Q586 306 600 306 L813 306 Q823 306 823 294 L821 193 Q821 182 809 181 Z';
const driverDisplay='M376 164 Q450 157 493 166 Q517 185 532 215 L365 215 L365 179 Q365 168 376 164 Z';
const driverSeat='M493 86 Q540 66 580 80 Q595 86 597 116 L592 156 Q619 168 626 204 L651 322 Q657 353 628 385 Q751 389 821 425 Q846 452 857 490 L591 490 L480 402 Q459 382 458 356 L443 222 Q444 179 472 165 L479 110 Q479 92 493 86 Z';
export const detailViews:Record<string,DetailView>={
 'route-front-body':{image:'frunk',path:'M140 43 Q233 10 387 35 Q476 80 533 196 L555 214 Q353 220 121 246 L116 365 Q272 390 435 370 L459 270 Q473 225 533 215 L145 215 L205 194 Q155 131 140 43 Z'},
 'route-rear-body':{image:'cargo',path:'M524 66 Q650 14 812 54 L815 84 Q703 133 529 130 Z M544 148 Q625 140 705 154 Q735 173 752 241 L751 310 Q658 333 546 312 Q534 251 537 188 Z'},
 'quick-equipment':{image:'cargo',path:'M550 165 Q621 149 699 165 Q725 206 736 263 L730 304 Q650 318 550 301 Q539 240 550 165 Z'},
 'route-rear-cabin':{image:'rear-seats',interior:true,path:'M340 12 Q499 0 669 14 L651 65 Q606 60 588 81 L581 115 Q562 122 559 168 L568 310 L580 366 Q503 381 427 364 L428 312 L413 169 Q414 128 359 116 L355 72 Z'},
 'route-passenger-cabin':{image:'front-seats',interior:true,path:'M0 0 L233 0 Q237 72 224 131 Q276 158 310 190 Q334 214 347 260 L409 384 Q425 433 429 490 L0 490 Z'},
 'route-driver-cabin':{image:'dashboard',interior:true,path:'M126 0 L1000 0 L1000 137 Q720 107 562 106 Q405 95 292 125 Q251 128 239 103 Z M0 204 Q111 173 260 139 L256 280 Q203 324 159 363 L39 490 L0 490 Z M309 157 Q358 123 456 134 Q544 147 562 209 Q587 280 552 357 Q517 411 442 411 Q349 416 309 350 Q278 296 286 233 Q286 186 309 157 Z'},
 'quick-driver-position':{image:'front-seats',interior:true,path:driverSeat},
 'quick-climate-display':{image:'dashboard',interior:true,path:dashboardScreen+' '+driverDisplay},
 'quick-order-mileage':{image:'dashboard',interior:true,path:driverDisplay},
 'quick-ready-to-leave':{image:'dashboard',interior:true,path:dashboardScreen+' '+driverDisplay+' M333 150 Q438 110 528 164 Q577 222 559 316 Q541 406 445 410 Q345 414 310 344 Q277 275 302 204 Q312 168 333 150 Z'},
};
export const detailFor=(id:string)=>detailViews[id]||(id.startsWith('accessory-')?detailViews['quick-equipment']:undefined);
export const frameUrl=(frame:number)=>'/r2-360/'+String(((frame-1)%72+72)%72+1).padStart(5,'0')+'.webp';
