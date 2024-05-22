import { useParams } from 'react-router-dom';
import { QueryKeys } from 'librechat-data-provider';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import type { TMessage } from 'librechat-data-provider';
import { useCustomAudioRef, MediaSourceAppender } from '~/hooks/Audio';
import { useAuthContext } from '~/hooks';
import { globalAudioId } from '~/common';
import store from '~/store';

function timeoutPromise(ms: number, message?: string) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message ?? 'Promise timed out')), ms),
  );
}

const promiseTimeoutMessage = 'Reader promise timed out';
const maxPromiseTime = 15000;

export default function StreamAudio({ index = 0 }) {
  const { token } = useAuthContext();

  const cacheTTS = useRecoilValue(store.cacheTTS);
  const playbackRate = useRecoilValue(store.playbackRate);

  const activeRunId = useRecoilValue(store.activeRunFamily(index));
  const automaticPlayback = useRecoilValue(store.automaticPlayback);
  const isSubmitting = useRecoilValue(store.isSubmittingFamily(index));
  const latestMessage = useRecoilValue(store.latestMessageFamily(index));
  const setIsPlaying = useSetRecoilState(store.globalAudioPlayingFamily(index));
  const [audioRunId, setAudioRunId] = useRecoilState(store.audioRunFamily(index));
  const [isFetching, setIsFetching] = useRecoilState(store.globalAudioFetchingFamily(index));
  const [globalAudioURL, setGlobalAudioURL] = useRecoilState(store.globalAudioURLFamily(index));

  const { audioRef } = useCustomAudioRef({ setIsPlaying });

  const { conversationId: paramId } = useParams();
  const queryParam = paramId === 'new' ? paramId : latestMessage?.conversationId ?? paramId ?? '';

  const queryClient = useQueryClient();
  const getMessages = useCallback(
    () => queryClient.getQueryData<TMessage[]>([QueryKeys.messages, queryParam]),
    [queryParam, queryClient],
  );

  useEffect(() => {
    const shouldFetch =
      token &&
      automaticPlayback &&
      isSubmitting &&
      latestMessage &&
      !latestMessage.isCreatedByUser &&
      (latestMessage.text || latestMessage.content) &&
      latestMessage.messageId &&
      !latestMessage.messageId.includes('_') &&
      !isFetching &&
      activeRunId &&
      activeRunId !== audioRunId;

    if (!shouldFetch) {
      return;
    }

    async function fetchAudio() {
      setIsFetching(true);

      try {
        if (audioRef.current) {
          audioRef.current.pause();
          URL.revokeObjectURL(audioRef.current.src);
          setGlobalAudioURL(null);
        }

        let cacheKey = latestMessage?.text ?? '';
        const cache = await caches.open('tts-responses');
        const cachedResponse = await cache.match(cacheKey);

        if (cachedResponse) {
          console.log('Audio found in cache');
          const audioBlob = await cachedResponse.blob();
          const blobUrl = URL.createObjectURL(audioBlob);
          setGlobalAudioURL(blobUrl);
          setAudioRunId(activeRunId);
          setIsFetching(false);
          return;
        }

        console.log('Fetching audio...');
        const response = await fetch('/api/files/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ messageId: latestMessage?.messageId, runId: activeRunId }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch audio');
        }
        if (!response.body) {
          throw new Error('Null Response body');
        }

        const reader = response.body.getReader();
        const mediaSource = new MediaSourceAppender('audio/mpeg');
        setGlobalAudioURL(mediaSource.mediaSourceUrl);
        setAudioRunId(activeRunId);

        let done = false;
        const chunks: Uint8Array[] = [];

        while (!done) {
          const readPromise = reader.read();
          const { value, done: readerDone } = (await Promise.race([
            readPromise,
            timeoutPromise(maxPromiseTime, promiseTimeoutMessage),
          ])) as ReadableStreamReadResult<Uint8Array>;

          if (cacheTTS && value) {
            chunks.push(value);
          }
          if (value) {
            mediaSource.addData(value);
          }
          done = readerDone;
        }

        if (chunks.length) {
          console.log('Adding audio to cache');
          const latestMessages = getMessages() ?? [];
          const targetMessage = latestMessages.find(
            (msg) => msg.messageId === latestMessage?.messageId,
          );
          cacheKey = targetMessage?.text ?? '';
          if (!cacheKey) {
            throw new Error('Cache key not found');
          }
          const audioBlob = new Blob(chunks, { type: 'audio/mpeg' });
          cache.put(cacheKey, new Response(audioBlob));
        }

        console.log('Audio stream reading ended');
      } catch (error) {
        if (error?.['message'] !== promiseTimeoutMessage) {
          console.log(promiseTimeoutMessage);
          return;
        }
        console.error('Error fetching audio:', error);
        setIsFetching(false);
        setGlobalAudioURL(null);
      } finally {
        setIsFetching(false);
      }
    }

    fetchAudio();
  }, [
    automaticPlayback,
    setGlobalAudioURL,
    setAudioRunId,
    setIsFetching,
    latestMessage,
    isSubmitting,
    activeRunId,
    getMessages,
    isFetching,
    audioRunId,
    cacheTTS,
    audioRef,
    token,
  ]);

  useEffect(() => {
    if (
      playbackRate &&
      globalAudioURL &&
      audioRef.current &&
      audioRef.current.playbackRate !== playbackRate
    ) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [audioRef, globalAudioURL, playbackRate]);

  return (
    <audio
      ref={audioRef}
      controls
      controlsList="nodownload nofullscreen noremoteplayback"
      className="absolute h-0 w-0 overflow-hidden"
      src={globalAudioURL || undefined}
      id={globalAudioId}
      autoPlay
    />
  );
}
