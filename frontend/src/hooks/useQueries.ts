import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Beat, Track, AppRole } from '../backend';
import { ExternalBlob } from '../backend';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetSharedBeats() {
  const { actor, isFetching } = useActor();

  return useQuery<Beat[]>({
    queryKey: ['sharedBeats'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSharedBeats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyBeats() {
  const { actor, isFetching } = useActor();

  return useQuery<Beat[]>({
    queryKey: ['myBeats'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyBeats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadBeat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      file,
    }: {
      id: string;
      title: string;
      description: string;
      file: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadBeat(id, title, description, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBeats'] });
    },
  });
}

export function useEditBeat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title, description }: { id: string; title: string; description: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editBeat(id, title, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBeats'] });
      queryClient.invalidateQueries({ queryKey: ['sharedBeats'] });
    },
  });
}

export function useDeleteBeat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteBeat(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBeats'] });
      queryClient.invalidateQueries({ queryKey: ['sharedBeats'] });
    },
  });
}

export function useShareBeat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.shareBeat(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBeats'] });
      queryClient.invalidateQueries({ queryKey: ['sharedBeats'] });
    },
  });
}

export function useUnshareBeat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unshareBeat(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBeats'] });
      queryClient.invalidateQueries({ queryKey: ['sharedBeats'] });
    },
  });
}

export function useGetMyTracks() {
  const { actor, isFetching } = useActor();

  return useQuery<Track[]>({
    queryKey: ['myTracks'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyTracks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveTrack() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      beatId,
      file,
    }: {
      id: string;
      title: string;
      beatId: string;
      file: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveTrack(id, title, beatId, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTracks'] });
    },
  });
}

export function useDeleteTrack() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTrack(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTracks'] });
    },
  });
}
