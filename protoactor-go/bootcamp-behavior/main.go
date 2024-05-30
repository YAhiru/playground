package main

import (
	"fmt"
	"github.com/YAhiru/playground/protoactor-go/bootcamp-behavior/actors"
	"github.com/YAhiru/playground/protoactor-go/bootcamp-behavior/messages"
	"github.com/asynkron/protoactor-go/actor"
	"time"
)

func main() {
	system := actor.NewActorSystem()
	println("Actor system created")

	props := actor.PropsFromProducer(
		func() actor.Actor {
			return actors.NewUserActor()
		},
	)
	pid := system.Root.Spawn(props)

	wait(2)
	println("Sending PlayMovieMessage (The Movie)")
	system.Root.Send(pid, messages.PlayMovieMessage{
		MovieTitle: "The Movie",
		UserID:     44,
	})

	wait(2)
	println("Sending another PlayMovieMessage (The Movie 2)")
	system.Root.Send(pid, messages.PlayMovieMessage{
		MovieTitle: "The Movie 2",
		UserID:     54,
	})

	wait(2)
	println("Sending a StopMovieMessage")
	system.Root.Send(pid, messages.StopMovieMessage{})

	wait(2)
	println("Sending another StopMovieMessage")
	system.Root.Send(pid, messages.StopMovieMessage{})

	wait(2)
}

func wait(s time.Duration) {
	fmt.Printf("wait %d seconds\n", s)
	time.Sleep(s * time.Second)
}
