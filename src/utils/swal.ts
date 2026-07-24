import Swal from 'sweetalert2';

// Ionic mounts the app root as position:fixed, so <body> has no in-flow
// content. SweetAlert2's default heightAuto behavior forces body height
// to auto, which collapses to 0 and breaks the alert's fixed positioning.
export default Swal.mixin({ heightAuto: false });
