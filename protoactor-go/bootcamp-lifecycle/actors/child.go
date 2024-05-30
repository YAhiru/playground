package actors

import (
	"github.com/YAhiru/playground/protoactor-go/bootcamp-lifecycle/messages"
	"github.com/asynkron/protoactor-go/actor"
	"github.com/fatih/color"
)

type PlaybackChildActor struct {
}

func (state *PlaybackChildActor) Receive(context actor.Context) {
	switch message := context.Message().(type) {
	case *actor.Restarting:
		state.ProcessRestartingMessage(message)
	case messages.Recoverable:
		state.ProcessRecoverableMessage(message)
	}
}

func (state *PlaybackChildActor) ProcessRestartingMessage(_ *actor.Restarting) {
	color.Green("ChildActor Restarting")
}

func (state *PlaybackChildActor) ProcessRecoverableMessage(_ messages.Recoverable) {
	panic("Failed to recover PlaybackChildActor")
}
