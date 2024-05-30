package main

import (
	"fmt"
	"github.com/YAhiru/playground/protoactor-go/bootcamp-lifecycle/actors"
	"github.com/YAhiru/playground/protoactor-go/bootcamp-lifecycle/messages"
	"github.com/asynkron/protoactor-go/actor"
	"os"
	"time"
)

func main() {
	stopStrategy := "stop"
	if len(os.Args) > 1 {
		stopStrategy = os.Args[1]
	}
	fmt.Printf("stop strategy: %s\n", stopStrategy)

	system := actor.NewActorSystem()

	props := actor.PropsFromProducer(
		func() actor.Actor {
			println("Creating a PlaybackActor")
			return &actors.PlaybackActor{}
		},
		actor.WithSupervisor(
			actor.NewOneForOneStrategy(1, 5*time.Second, actor.DefaultDecider),
		),
	)
	fmt.Println("spawn actor")
	pid := system.Root.Spawn(props)

	fmt.Println("send message 1")
	system.Root.Send(pid, messages.PlayMovieMessage{
		MovieTitle: "The Movie",
		UserID:     44,
	})

	wait(2)
	fmt.Println("send message 2")
	system.Root.Send(pid, messages.PlayMovieMessage{
		MovieTitle: "The Movie 2",
		UserID:     54,
	})
	fmt.Println("send message 3")
	system.Root.Send(pid, messages.PlayMovieMessage{
		MovieTitle: "The Movie 3",
		UserID:     64,
	})
	fmt.Println("send message 4")
	system.Root.Send(pid, messages.PlayMovieMessage{
		MovieTitle: "The Movie 4",
		UserID:     74,
	})

	fmt.Println("restart actor")
	system.Root.Send(pid, messages.Recoverable{})

	if stopStrategy == "poison" {
		fmt.Println("poison actor")
		system.Root.Poison(pid)
	} else {
		fmt.Println("stop actor")
		system.Root.Stop(pid)
	}

	time.Sleep(5 * time.Second)
}

func wait(s time.Duration) {
	fmt.Printf("wait %d seconds\n", s)
	time.Sleep(s * time.Second)
}
