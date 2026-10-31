// src/components/ui/index.ts
// Barrel export for UI components

export { Button, type ButtonProps } from './Button';
export { Input, type InputProps } from './Input';
export { TextArea, type TextAreaProps } from './TextArea';
export { SelectComponent as Select, type SelectProps, type SelectOption } from './Select';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, type CardProps } from './Card';
export { Modal, AlertDialog, type ModalProps, type AlertDialogProps } from './Modal';
export { Table, SimpleTable, TableHeader, TableBody, TableRow, TableHead, TableCell, type TableProps, type Column } from './Table';
export { Badge, StatusBadge, type BadgeProps } from './Badge';
export { Avatar, AvatarGroup, type AvatarProps, type AvatarGroupProps } from './Avatar';
export { ToastContainer, useToast, toast, type ToastProps } from './Toast';