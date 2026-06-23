/**
 * Botão para iniciar recarga via PIX
 * Componente simples que abre o modal de recarga
 */

import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PixRechargeModal } from './PixRechargeModal';

export function PixRechargeButton({ cardUuid, cardNumber, currentBalance }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg"
        size="lg"
      >
        <CreditCard className="mr-2 h-5 w-5" />
        Recarregar com PIX
      </Button>

      <PixRechargeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cardUuid={cardUuid}
        cardNumber={cardNumber}
        currentBalance={currentBalance}
      />
    </>
  );
}

// Made with Bob
