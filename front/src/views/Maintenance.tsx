import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MaintenanceHeader, {
  type MaintenanceViewMode,
} from '../components/maintenance/MaintenanceHeader';
import TicketCreateForm from '../components/maintenance/TicketCreateForm';
import TicketDetails from '../components/maintenance/TicketDetails';
import TicketList from '../components/maintenance/TicketList';
import { maintenancePermissions } from '../components/maintenance/constants';
import useService from '../helpers/useService';
import hasPermission from '../helpers/hasPermission';
import hasResidency from '../helpers/hasResidency';
import type {
  MaintenanceTicket,
  MaintenanceTicketDetails,
  MaintenanceTicketStatus,
} from '../types/Maintenance';
import { useToast } from '../components/Toast';

interface BuildingPerson {
  id: string;
  name: string | null;
}

interface BuildingResidency {
  id: string;
  name: string | null;
  users: BuildingPerson[];
}

interface BuildingGroup {
  residencies: BuildingResidency[];
}

interface BuildingDetails {
  residentData: BuildingGroup[];
  remainingUsers: BuildingPerson[];
}

export default function Maintenance() {
  const { t } = useTranslation();
  const maintenanceService = useService('maintenance');
  const coreService = useService('core');
  const { notifyError } = useToast();
  const canCreate = hasResidency() || hasPermission([maintenancePermissions.viewBuilding]);
  const canLoadBuildingDirectory = hasPermission([
    maintenancePermissions.viewBuilding,
    maintenancePermissions.triage,
    maintenancePermissions.work,
    maintenancePermissions.close,
    maintenancePermissions.internalComment,
  ]);
  const [mode, setMode] = useState<MaintenanceViewMode>('tickets');
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicketDetails | null>(null);
  const [statusFilter, setStatusFilter] = useState<MaintenanceTicketStatus | ''>('');
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [buildingDetails, setBuildingDetails] = useState<BuildingDetails>({
    residentData: [],
    remainingUsers: [],
  });

  const people = useMemo(() => {
    const result: Record<string, string> = {};
    for (const group of buildingDetails.residentData) {
      for (const residency of group.residencies) {
        for (const user of residency.users) {
          if (user.name) result[user.id] = user.name;
        }
      }
    }
    for (const user of buildingDetails.remainingUsers) {
      if (user.name) result[user.id] = user.name;
    }
    return result;
  }, [buildingDetails]);

  const residencyNames = useMemo(() => {
    const result: Record<string, string> = {};
    const currentResidencyId = localStorage.getItem('residencyId');
    const currentResidencyName = localStorage.getItem('residencyName');
    if (currentResidencyId && currentResidencyName) {
      result[currentResidencyId] = currentResidencyName;
    }
    for (const group of buildingDetails.residentData) {
      for (const residency of group.residencies) {
        if (residency.name) result[residency.id] = residency.name;
      }
    }
    return result;
  }, [buildingDetails]);

  const staff = useMemo(
    () =>
      buildingDetails.remainingUsers
        .filter((user): user is { id: string; name: string } => Boolean(user.name))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [buildingDetails.remainingUsers],
  );

  const fetchTickets = useCallback(
    async (preferredTicketId?: string, filter = statusFilter) => {
      setIsLoadingList(true);
      try {
        const response = await maintenanceService.get<MaintenanceTicket[]>('/tickets', {
          params: filter ? { status: filter } : undefined,
        });
        setTickets(response.data);
        setSelectedId((current) => {
          if (
            preferredTicketId &&
            response.data.some((ticket) => ticket.id === preferredTicketId)
          ) {
            return preferredTicketId;
          }
          if (current && response.data.some((ticket) => ticket.id === current)) return current;
          return response.data[0]?.id ?? null;
        });
      } catch (error) {
        console.error(error);
        notifyError(t('common:error'), t('maintenance:toast.listError'));
      } finally {
        setIsLoadingList(false);
      }
    },
    [maintenanceService, notifyError, statusFilter, t],
  );

  const fetchTicketDetails = useCallback(async () => {
    if (!selectedId) {
      setSelectedTicket(null);
      return;
    }

    setIsLoadingDetails(true);
    try {
      const response = await maintenanceService.get<MaintenanceTicketDetails>(
        `/tickets/${selectedId}`,
      );
      setSelectedTicket(response.data);
    } catch (error) {
      console.error(error);
      notifyError(t('common:error'), t('maintenance:toast.detailsError'));
    } finally {
      setIsLoadingDetails(false);
    }
  }, [maintenanceService, notifyError, selectedId, t]);

  const refreshSelectedTicket = useCallback(async () => {
    await Promise.all([fetchTicketDetails(), fetchTickets()]);
  }, [fetchTicketDetails, fetchTickets]);

  useEffect(() => {
    void fetchTickets(undefined, statusFilter);
  }, [fetchTickets, statusFilter]);

  useEffect(() => {
    void fetchTicketDetails();
  }, [fetchTicketDetails]);

  useEffect(() => {
    const buildingId = localStorage.getItem('buildingId');
    if (!buildingId || !canLoadBuildingDirectory) return;

    void coreService
      .get<BuildingDetails>(`/building/${buildingId}/details`)
      .then((response) => setBuildingDetails(response.data))
      .catch((error) => console.error(error));
  }, [canLoadBuildingDirectory, coreService]);

  function handleCreated(ticketId: string) {
    setSelectedId(ticketId);
    setStatusFilter('');
    setMode('tickets');
    void fetchTickets(ticketId, '');
  }

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden p-3 md:p-6">
      <MaintenanceHeader activeMode={mode} canCreate={canCreate} onModeChange={setMode} />

      {mode === 'create' && canCreate ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <TicketCreateForm onCreated={handleCreated} />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,2fr)]">
          <TicketList
            tickets={tickets}
            selectedId={selectedId}
            statusFilter={statusFilter}
            isLoading={isLoadingList}
            residencyNames={residencyNames}
            onFilterChange={setStatusFilter}
            onRefresh={() => void fetchTickets(undefined, statusFilter)}
            onSelect={setSelectedId}
          />
          <TicketDetails
            ticket={selectedTicket}
            people={people}
            residencyNames={residencyNames}
            staff={staff}
            isLoading={isLoadingDetails}
            onRefresh={refreshSelectedTicket}
          />
        </div>
      )}
    </main>
  );
}
