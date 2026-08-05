import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onRecover: () => void;
}

interface State { hasError: boolean; }

export class RouteErrorBoundary extends Component<Props, State> {
  declare props: Readonly<Props>;
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Erro ao renderizar módulo:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white border border-red-200 rounded-2xl p-8 text-center space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Não foi possível abrir esta tela</h2>
          <p className="text-sm text-slate-500">O erro foi registrado. Volte ao painel e tente novamente.</p>
          <button onClick={this.props.onRecover} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm">Voltar ao painel</button>
        </div>
      );
    }
    return this.props.children;
  }
}
