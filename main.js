class Rect
{
    constructor(x=0, y=0, h=10, w=10)
    {
        this.x = x;
        this.y = y;
        this.h = h;
        this.w = w;
    }

    to_dict()
    {
        return {
            'x': this.x,
            'y': this.y,
            'height': this.h,
            'width': this.w
        }
    }
}

function check_rect_colition(A, B){
    if(
        (
            (
                (A.x < B.x) && (A.x + A.w > B.x)
            ) || (
                (A.x > B.x) && (B.x + B.w > A.x)
            )
        ) && (
            (
                (A.y < B.y) && (A.y + A.h > B.y)
            ) || (
                (A.y > B.y) && (B.y + B.h > A.y)
            )
        )
    ){
        return true;
    }
    return false;
}

class Point
{
    constructor(x=0, y=0)
    {
        this.x = x;
        this.y = y;
    }
}

class Screen
{
    constructor(canvas_id, color="#000000")
    {
        this.canvas = document.getElementById(canvas_id);
        this.context = this.canvas.getContext("2d");
        this.width  = this.canvas.width;
        this.height = this.canvas.height;
        this.color = color;
    }

    clear()
    {
        this.context.fillStyle = this.color;
        this.context.fillRect(0, 0, this.width, this.height);
    }
}

class Entity
{
    constructor(x, y, h, w, speed, color)
    {
        this.position  = new Rect(x, y, h, w);
        this.speed_max = new Point(speed, speed);
        this.color     = color;

        this.speed     = new Point();
    }

    get_future()
    {
        return new Point(
            this.position.x + this.speed.x,
            this.position.y + this.speed.y
        )
    }

    move_up()    { this.speed.y = -this.speed_max.y; }
    move_down()  { this.speed.y =  this.speed_max.y; }
    move_left()  { this.speed.x = -this.speed_max.x; }
    move_right() { this.speed.x =  this.speed_max.x; }

    update()
    {
        this.position.x += this.speed.x;
        this.position.y += this.speed.y;
        this.speed.x = 0;
        this.speed.y = 0;
    }

    draw(context)
    {
        context.fillStyle = this.color;
        context.fillRect(
            this.position.x,
            this.position.y,
            this.position.w,
            this.position.h
        );
    }
}

class Input
{
    constructor()
    {
        this.left  = 65;
        this.right = 68;
        this.up    = 87;
        this.down  = 83;

        this.on  = true;
        this.off = false;

        this.keys = {}

        this.keys[this.left]  = this.off;
        this.keys[this.right] = this.off;
        this.keys[this.up]    = this.off;
        this.keys[this.down]  = this.off;

        document.onkeydown = this.key_on.bind(this);
        document.onkeyup   = this.key_off.bind(this);
    }

    key_on(event)
    {
        var key = event.keyCode;
        var keys = Object.keys(this.keys)

        if (keys.includes(key.toString()))
        {
            this.keys[key] = this.on;
        }
    }

    key_off(event)
    {
        var key = event.keyCode;
        var keys = Object.keys(this.keys)

        if (keys.includes(key.toString()))
        {
            this.keys[key] = this.off;
        }
    }
}




var w =  30;
var h = 120;
var padding = 50

var screen = new Screen('can');
var input  = new Input();

var player = new Entity(
    padding, 10, h, w,
    7, '#FFFFFF'
);

var cpu = new Entity(
    screen.width - w - padding, 10, h, w,
    7, '#FFFFFF'
);

var ball = new Entity(
    screen.width/2, screen.height/2, 20, 20,
    5, '#FFFFFF'
);

ball.speed_max.x *= 2;
ball.speed_max.y /= 2;

var objects = [
    player,
    cpu,
    ball
];

var players = [
    player,
    cpu
];

var temp_ball_speed = new Point(ball.speed_max.x, ball.speed_max.y);

function game_loop(){
    // Check player input and AI
    ball.speed.x = temp_ball_speed.x;
    ball.speed.y = temp_ball_speed.y;

    if (input.keys[input.up]) { player.move_up() }
    if (input.keys[input.down]) { player.move_down() }


    if (ball.speed.x > 0){
        if (ball.position.x < cpu.position.x){ cpu.move_up() }
        if (ball.position.y > cpu.position.y){ cpu.move_down() }
    }

    // Colition detection

    // Colition between players and screen
    players.forEach(entity => {
        player_future = entity.get_future();
        if ((player_future.y < 0) || (player_future.y + entity.position.h > screen.height))
        { entity.speed.y = 0; }

        if ((player_future.x < 0) || (player_future.x + entity.position.w > screen.width))
        { entity.speed.x = 0; }
    })

    // Colition between ball and screen
    ball_future = ball.get_future();
    if ((ball_future.y < 0) || (ball_future.y + ball.position.h > screen.height))
    {
        ball.speed.y *= -1;
    
    }

    if ((ball_future.x < 0) || (ball_future.x + ball.position.w > screen.width))
    { 
        ball.position.x = screen.width/2;
        ball.position.y = screen.height/2;
        ball.speed.x = -(ball.speed.x/Math.abs(ball.speed.x))*Math.abs(ball.speed_max.x);
        ball.speed.y = -(ball.speed.y/Math.abs(ball.speed.y))*Math.abs(ball.speed_max.y);

    }

    // Colition between ball and players

    player_top_box = new Rect(
        player.position.x,
        player.position.y,
        player.position.h/4,
        player.position.w
    );

    player_middle_box = new Rect(
        player.position.x,
        player.position.y + player.position.h/4,
        player.position.h/2,
        player.position.w
    );

    player_bottom_box = new Rect(
        player.position.x,
        player.position.y + 3*player.position.h/4,
        player.position.h/4,
        player.position.w
    );
    if (
        check_rect_colition(player_top_box, ball.position) &&
        (ball.speed.x < 0)
    )
    {
        ball.speed.x *= -1;
        if (ball.speed.y > 0) { ball.speed.y *= -1.5; }
    }
    else if (
        check_rect_colition(player_middle_box, ball.position) &&
        (ball.speed.x < 0)
    )
    {
        ball.speed.x *= -1;
        if (ball.speed.y > 0) { ball.speed.y /= -1.5; }
    }
    else if (
        check_rect_colition(player_bottom_box, ball.position) &&
        (ball.speed.x < 0)
    )
    {
        ball.speed.x = -ball.speed.x;
        if (ball.speed.y < 0) { ball.speed.y *= -1.5; }
    }


    cpu_top_box = new Rect(
        cpu.position.x,
        cpu.position.y,
        cpu.position.h/4,
        cpu.position.w
    );
    cpu_middle_box = new Rect(
        cpu.position.x,
        cpu.position.y + cpu.position.h/4,
        cpu.position.h/2,
        cpu.position.w
    );
    cpu_bottom_box = new Rect(
        cpu.position.x,
        cpu.position.y + 3*cpu.position.h/4,
        cpu.position.h/4,
        cpu.position.w
    );
    if (
        check_rect_colition(cpu_top_box, ball.position) &&
        (ball.speed.x > 0)
    )
    {
        ball.speed.x = -ball.speed.x;
        if (ball.speed.y > 0) { ball.speed.y *= -1.5; }

    }
    else if (
        check_rect_colition(cpu_middle_box, ball.position) &&
        (ball.speed.x > 0)
    )
    {
        ball.speed.x = -ball.speed.x;
        if (ball.speed.y > 0) { ball.speed.y /= -1.5; }
    }
    else if (
        check_rect_colition(cpu_bottom_box, ball.position) &&
        (ball.speed.x > 0)
    )
    {
        ball.speed.x = -ball.speed.x;
        if (ball.speed.y < 0) { ball.speed.y *= -1.5; }
    }

    if (Math.abs(ball.speed.y) > ball.speed_max.y*6)
    {
        ball.speed.y = ball.speed_max.y*4;
    }


    // Update state
    temp_ball_speed.x = ball.speed.x;
    temp_ball_speed.y = ball.speed.y;
    objects.forEach(entity => entity.update());

    // Render
    screen.clear();
    objects.forEach(entity => entity.draw(screen.context));
    window.requestAnimationFrame(game_loop);
}

game_loop();

