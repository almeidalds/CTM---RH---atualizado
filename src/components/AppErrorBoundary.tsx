import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || "Erro inesperado ao carregar o aplicativo.",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Falha ao renderizar o CTM RH:", error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">CTM Brasil · RH</p>
          <h1 className="mt-2 text-xl font-bold text-slate-900">O aplicativo não conseguiu carregar esta tela.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Recarregue o aplicativo. Se o problema continuar, copie a mensagem abaixo e envie para o suporte.
          </p>
          <pre className="mt-4 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{this.state.message}</pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Recarregar aplicativo
          </button>
        </section>
      </main>
    );
  }
}
