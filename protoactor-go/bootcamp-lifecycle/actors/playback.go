package actors

import (
	"github.com/YAhiru/playground/protoactor-go/bootcamp-lifecycle/messages"
	"github.com/asynkron/protoactor-go/actor"
	"github.com/fatih/color"
)

type PlaybackActor struct {
}

func (state *PlaybackActor) Receive(context actor.Context) {
	switch message := context.Message().(type) {
	case *actor.Started:
		state.ProcessStartedMessage(message)
	case messages.PlayMovieMessage:
		state.ProcessPlayMovieMessage(message)
	case messages.Recoverable:
		state.ProcessRecoverableMessage(context, message)
	case *actor.Stopping:
		state.ProcessStoppingMessage(message)
	case *actor.Stopped:
		state.ProcessStoppedMessage(message)
	}
}

func (state *PlaybackActor) ProcessPlayMovieMessage(m messages.PlayMovieMessage) {
	color.Yellow("PlayMovieMessage %s for user %d", m.MovieTitle, m.UserID)
}

func (state *PlaybackActor) ProcessStartedMessage(_ *actor.Started) {
	color.Green("PlaybackActor Started")
}

func (state *PlaybackActor) ProcessRecoverableMessage(context actor.Context, _ messages.Recoverable) {
	var child *actor.PID
	if len(context.Children()) == 0 {
		child = context.Spawn(actor.PropsFromProducer(func() actor.Actor {
			return &PlaybackChildActor{}
		}))
	} else {
		child = context.Children()[0]
	}

	context.Forward(child)
}

func (state *PlaybackActor) ProcessStoppingMessage(_ *actor.Stopping) {
	color.Green("PlaybackActor Stopping")
}

func (state *PlaybackActor) ProcessStoppedMessage(_ *actor.Stopped) {
	color.Green("PlaybackActor Stopped")
}
