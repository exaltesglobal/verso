import splash from "../assets/brand/splash.png";

/** Launch splash from the brand kit (07-Social/app-splash-screen). */
export function Splash() {
  return (
    <div className="splash" role="status" aria-label="Verso is starting">
      <img src={splash} alt="" width={960} height={600} />
    </div>
  );
}
