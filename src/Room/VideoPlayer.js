import React, { useState, useEffect } from "react";
import Youtube from "react-youtube";
import { useRoomContext } from "./ContextRoom";

export default function VideoPlayer({ videoId }) {
  const {
    val: { seekTo, startAt, stopAt, isPlaying },
    ref: roomRef,
  } = useRoomContext();
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    if (player && seekTo) {
      player.seekTo(seekTo);
      roomRef.child("seekTo").set(null);
    }
  }, [player, seekTo]);

  useEffect(() => {
    if (player) {
      isPlaying ? player.playVideo() : player.pauseVideo();
    }
  }, [isPlaying, player]);

  const opts = {
    width: "100%",
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      autoplay: 0,
      controls: 0,
      modestbranding: 1,
      iv_load_policy: 3,
      disablekb: 1,
    },
  };
  const onReady = (event) => {
    setPlayer(event.target);
    const currentTime = isPlaying ? (Date.now() - startAt) / 1000 : stopAt;
    if (isPlaying) event.target.seekTo(currentTime);
    else event.target.seekTo(currentTime).pauseVideo();
  };
  return (
    <>
      <Youtube
        videoId={videoId}
        opts={opts}
        onReady={onReady}
        style={{ width: "100%" }}
      />
      {player && (
        <div style={{ display: "flex" }}>
          <ToggleButton
            roomRef={roomRef}
            isPlaying={isPlaying}
            player={player}
            disabled={!player}
          />
          <div style={{ flex: 1 }}>
            <Seekbar roomRef={roomRef} isPlaying={isPlaying} player={player} />
          </div>
        </div>
      )}
    </>
  );
}

function ToggleButton({ roomRef, isPlaying, disabled = true, player }) {
  const onClick = () => {
    roomRef.child("isPlaying").set(!isPlaying);
    if (!isPlaying) roomRef.child("startAt").set(Date.now());
    if (isPlaying) roomRef.child("stopAt").set(player.getCurrentTime());
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ fontSize: 30, width: "100px" }}
    >
      {isPlaying ? "Puase" : "Play"}
    </button>
  );
}

function Seekbar({ player, roomRef, isPlaying }) {
  const duration = player.getDuration();

  const [updated, setUpdated] = useState();
  const [time, setTime] = useState(() => player.getCurrentTime());

  useEffect(() => {
    if (isPlaying) {
      let id = setTimeout(() => {
        setTime(player.getCurrentTime());
        setUpdated([]);
      }, 100);
      return () => clearTimeout(id);
    }
  }, [time, updated, isPlaying]);

  function onChange(e) {
    const val = parseFloat(e.target.value, 10);
    roomRef.child("seekTo").set(val);
    roomRef.child("startAt").set(Date.now());
    setTime(val);
  }
  return (
    <input
      type="range"
      max={duration}
      step={0.1}
      style={{ width: "100%" }}
      value={time}
      onChange={onChange}
    />
  );
}
