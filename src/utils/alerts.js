import Swal from 'sweetalert2';

// Shared SweetAlert theme matching the site (red brand accent).
const BRAND = '#e31837';

// Confirmation dialog — replaces window.confirm. Returns a Promise<boolean>.
export const confirmAction = async ({
  title = 'Are you sure?',
  text = '',
  confirmText = 'Yes',
  cancelText = 'Cancel',
  icon = 'warning',
  danger = false,
} = {}) => {
  const res = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: danger ? '#e31837' : BRAND,
    cancelButtonColor: '#6b7280',
    reverseButtons: true,
    focusCancel: true,
  });
  return res.isConfirmed;
};

// Modal alert — replaces window.alert.
export const alertMessage = (text, title = '', icon = 'info') =>
  Swal.fire({ title, text, icon, confirmButtonColor: BRAND });

// Toastr-style toast in the top-right corner.
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
});

export const toast = (title, icon = 'success') => Toast.fire({ icon, title });
