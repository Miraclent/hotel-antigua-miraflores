
class MetodoPago {
  procesar(monto) {
    throw new Error('El método procesar() debe implementarse');
  }
}

class PagoEfectivo extends MetodoPago {
  procesar(monto) {
    return { monto, metodo: 'efectivo' };
  }
}

class PagoTarjeta extends MetodoPago {
  procesar(monto) {
    return { monto, metodo: 'tarjeta' };
  }
}

class PagoTransferencia extends MetodoPago {
  procesar(monto) {
    return { monto, metodo: 'transferencia' };
  }
}

class PagoYapePlin extends MetodoPago {
  procesar(monto) {
    return { monto, metodo: 'yape' };
  }
}


class MetodoPagoFactory {
  static metodos = new Map([
    ['efectivo', PagoEfectivo],
    ['tarjeta', PagoTarjeta],
    ['transferencia', PagoTransferencia],
    ['yape', PagoYapePlin]
  ]);

  static registrar(metodo, clasePago) {
    this.metodos.set(metodo, clasePago);
  }

  static crear(metodo) {
    const ClasePago = this.metodos.get(metodo);

    if (!ClasePago) {
      throw new Error(`Método de pago no soportado: ${metodo}`);
    }

    return new ClasePago();
  }
}


module.exports = {
  MetodoPago,
  PagoEfectivo,
  PagoTarjeta,
  PagoTransferencia,
  PagoYapePlin,
  MetodoPagoFactory
};
