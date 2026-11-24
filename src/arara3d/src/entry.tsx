import { createRoot, type Root } from "react-dom/client";
import { ClothesRack, type ClothesRackItem } from "./dimaac/clothes-rack";
import { foto, fotoBlob, visor, disponivel } from "./studio";

const raizes = new WeakMap<Element, Root>();
function arara(el: HTMLElement, itens: ClothesRackItem[], aoEscolher: (i: number) => void, opcoes: Record<string, unknown> = {}) {
  raizes.get(el)?.unmount();
  const root = createRoot(el); raizes.set(el, root);
  root.render(<ClothesRack items={itens} onSelect={(_, i) => aoEscolher(i)} breeze={0.6} flow={1.2} swing={3} rail="chrome" hanger="wood" size={0.4} className="h-full w-full" {...opcoes} />);
  return () => { root.unmount(); raizes.delete(el); };
}
(window as unknown as Record<string, unknown>).Ciranda3D = { arara, foto, fotoBlob, visor, disponivel };
