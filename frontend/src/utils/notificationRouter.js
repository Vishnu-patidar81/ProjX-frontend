/**
 * Centralised notification routing utility.
 * Resolves the destination route and state based on:
 * - notification.type
 * - user.role
 * - notification.metadata
 *
 * Keeps support for legacy notification.link if no match is found.
 */
export const getNotificationRoute = (notification, role) => {
  const { type, referenceId, metadata = {}, link } = notification;

  // 1. Resolve based on type, role, and metadata
  switch (type) {
    case 'project_submission':
      if (role === 'teacher') {
        return { path: '/teacher/approvals', state: { highlightId: referenceId } };
      }
      if (role === 'admin') {
        return { path: '/admin/approvals', state: { highlightId: referenceId } };
      }
      break;

    case 'project_approved':
    case 'project_rejected':
      if (role === 'student') {
        return { path: '/student/group', state: { highlightId: referenceId } };
      }
      break;

    case 'announcement':
      if (role === 'student') {
        return { path: '/student/announcements', state: { highlightId: referenceId } };
      }
      if (role === 'guide') {
        return { path: '/guide/announcements', state: { highlightId: referenceId } };
      }
      if (role === 'teacher') {
        return { path: '/teacher/announcements', state: { highlightId: referenceId } };
      }
      break;

    case 'meeting_scheduled':
    case 'meeting_accepted':
    case 'meeting_rejected':
    case 'meeting_report':
      if (role === 'student') {
        return { path: '/student/meetings', state: { highlightId: referenceId } };
      }
      if (role === 'guide' || role === 'teacher') {
        return { path: '/guide/meetings', state: { highlightId: referenceId } };
      }
      break;

    case 'guide_assignment':
    case 'guide_assigned':
      if (role === 'guide' || role === 'teacher') {
        return { path: '/guide/dashboard', state: { highlightId: referenceId } };
      }
      if (role === 'student') {
        return { path: '/student/group', state: { highlightId: referenceId } };
      }
      break;

    case 'guide_accepted':
    case 'guide_rejected':
      if (role === 'student') {
        return { path: '/student/group', state: { highlightId: referenceId } };
      }
      if (role === 'admin') {
        return { path: '/admin/guide-assign', state: { highlightId: referenceId } };
      }
      break;

    case 'student_file_submission':
      if (metadata.submissionType === 'teacher') {
        return { path: '/teacher/submissions', state: { highlightId: referenceId } };
      }
      if (metadata.submissionType === 'guide') {
        return { path: '/guide/submissions', state: { highlightId: referenceId } };
      }
      if (role === 'teacher') {
        return { path: '/teacher/submissions', state: { highlightId: referenceId } };
      }
      if (role === 'guide') {
        return { path: '/guide/submissions', state: { highlightId: referenceId } };
      }
      break;

    case 'file_review':
      if (role === 'student') {
        return { path: '/student/submissions', state: { highlightId: referenceId } };
      }
      break;

    case 'progress_update':
    case 'progress_updated':
      if (role === 'student') {
        return { path: '/student/dashboard', state: { highlightId: referenceId } };
      }
      if (role === 'guide' || role === 'teacher') {
        return { path: '/guide/dashboard', state: { highlightId: referenceId, openProgress: true } };
      }
      break;

    case 'evaluation':
    case 'marks_updated':
      if (role === 'student') {
        return { path: '/student/marks', state: { highlightId: referenceId } };
      }
      break;

    case 'chat_message':
      if (role === 'student') {
        return { path: '/student/dashboard', state: { highlightId: referenceId, openChat: true } };
      }
      if (role === 'guide' || role === 'teacher') {
        return { path: '/guide/dashboard', state: { highlightId: referenceId, openChat: true } };
      }
      break;

    default:
      break;
  }

  // 2. Legacy fallback
  if (link) {
    return { path: link, state: { highlightId: referenceId } };
  }

  return { path: '/', state: {} };
};
