import { Pdv } from "./pdv";

export default function VendasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Vendas (PDV)
        </h1>
        <p className="text-sm text-neutral-500">
          Ponto de venda — leitura por código de barras
        </p>
      </div>
      <Pdv />
    </div>
  );
}
