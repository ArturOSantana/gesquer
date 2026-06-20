import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

/**
 * Componente reutilizável para confirmação de exclusão
 * @param {Object} props
 * @param {boolean} props.open - Estado de abertura do dialog
 * @param {Function} props.onClose - Callback ao fechar
 * @param {Function} props.onConfirm - Callback ao confirmar exclusão
 * @param {string} props.title - Título do dialog
 * @param {string} props.description - Descrição da ação
 * @param {string} props.itemName - Nome do item a ser excluído
 * @param {string[]} props.warnings - Lista de avisos
 * @param {boolean} props.isDeleting - Estado de loading durante exclusão
 */
export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  warnings = [],
  isDeleting = false,
}) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>{description}</p>
            
            {itemName && (
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <p className="font-medium text-gray-900">
                  Item: <span className="text-red-600">{itemName}</span>
                </p>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                <p className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Atenção:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-sm font-semibold text-red-600">
              Esta ação não pode ser desfeita!
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Made with Bob
