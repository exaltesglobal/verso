import { useCredits } from "../../lib/credits";
import { Dialog } from "../account/Dialog";
import { BuyCreditsDialog } from "./BuyCreditsDialog";
import { OutOfCredits } from "./OutOfCredits";

/** App-wide credit dialogs, mounted once in main.tsx and opened via useCredits(). */
export function CreditsHost() {
  const { buyOpen, closeBuy, outOfCredits, closeOutOfCredits } = useCredits();
  return (
    <>
      {outOfCredits !== null && (
        <Dialog title="Not enough credits" onClose={closeOutOfCredits}>
          <OutOfCredits message={outOfCredits} onDone={closeOutOfCredits} />
        </Dialog>
      )}
      {buyOpen && <BuyCreditsDialog onClose={closeBuy} />}
    </>
  );
}
