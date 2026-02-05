# Build command for Render - compiles C engine
build:
	cd c_engine && gcc -o recommender recommender.c -lm
	cd c_engine && gcc -o movie_system system_main.c auth.c comments.c chat.c mylist.c utils.c -lm
	pip install -r requirements.txt
