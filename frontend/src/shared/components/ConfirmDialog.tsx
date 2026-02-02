import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  content?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export const ConfirmDialog = ({
  open,
  title,
  message,
  content,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  confirmColor = 'primary',
  isLoading = false,
  onConfirm,
  onCancel,
  onClose,
}: ConfirmDialogProps) => {
  const handleClose = onClose || onCancel || (() => {});
  const displayMessage = content || message;

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{displayMessage}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={confirmColor}
          disabled={isLoading}
          autoFocus
        >
          {isLoading ? <CircularProgress size={20} /> : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
