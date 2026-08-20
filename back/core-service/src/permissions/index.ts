// Core permissions
export const AdminPermission = '@core:admin';
export const UserManagePermission = '@core:user:manage';

// Delivery Service
export const DeliveryCreatePermission = '@delivery:create';
export const DeliveryListPermission = '@delivery:view:building';
export const DeliveryViewPermission = '@delivery:view:residency';

// Communication Service
export const CommunicationManagePermission = '@communication:post:manage';

// Visitor Service
export const VisitorViewPermission = '@visitor:view';
export const VisitorCreatePermission = '@visitor:create';

// Reservation Service
export const ReservationCreatePermission = '@reservation:create';
export const ReservationViewResidencyPermission = '@reservation:view:residency';
export const ReservationViewBuildingPermission = '@reservation:view:building';

// File Service
export const FileUploadPermission = '@file:upload';
export const FileViewBuildingPermission = '@file:view:building';
export const FileViewResidencyPermission = '@file:view:residency';

// Maintenance Service
export const MaintenanceViewBuildingPermission = '@maintenance:ticket:view:building';
export const MaintenanceViewResidencyPermission = '@maintenance:ticket:view:residency';
export const MaintenanceTriagePermission = '@maintenance:ticket:triage';
export const MaintenanceWorkPermission = '@maintenance:ticket:work';
export const MaintenanceClosePermission = '@maintenance:ticket:close';
export const MaintenanceInternalCommentPermission = '@maintenance:ticket:comment:internal';
