import Swal from 'sweetalert2'

export async function alertSuccess(title: string, text?: string) {
  return Swal.fire({ icon: 'success', title, text })
}

export async function alertError(title: string, text?: string) {
  return Swal.fire({ icon: 'error', title, text })
}

export async function confirmAction(opts: {
  title: string
  text?: string
  confirmButtonText?: string
  cancelButtonText?: string
}) {
  const res = await Swal.fire({
    icon: 'warning',
    title: opts.title,
    text: opts.text,
    showCancelButton: true,
    confirmButtonText: opts.confirmButtonText ?? 'Yes',
    cancelButtonText: opts.cancelButtonText ?? 'Cancel',
    confirmButtonColor: '#9ac200',
  })
  return res.isConfirmed
}

export function showLoading(title: string, text?: string) {
  void Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading()
    },
  })
}

export function closeAlert() {
  Swal.close()
}
