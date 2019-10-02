-- view activities of a project with interval 2 days
SELECT time::date AS date, time::time AS time, title, description, author, 
CONCAT(firstname, ' ', lastname) author_name
FROM activities, users
WHERE author = userid
AND projectid = 14
AND activities.time BETWEEN NOW() - interval '2 days' AND NOW() - interval '0 days'
ORDER BY activities.time DESC;

SELECT time::date as date, time::time as time, title, description, CONCAT(firstname, ' ', lastname) author_name, projectname
FROM activities, users, projects
WHERE author = userid AND activities.projectid = projects.projectid
AND activities.projectid = 14
AND time::date IN (
	SELECT DISTINCT time::date FROM activities
	ORDER BY time DESC
	LIMIT 2 OFFSET 0
)
ORDER BY activities.time DESC;

-- get maximum num of days in the activities of a project
SELECT (MIN(time) >= NOW() - interval '2 days') is_max_days  FROM activities
WHERE projectid = 14;

-- get num of activities in a project for 2 days
SELECT COUNT(*) num_activities FROM activities 
WHERE projectid = 14 AND time BETWEEN NOW() - interval '2 days' AND NOW() - interval '0 days';

-- get num of dates
SELECT COUNT(DISTINCT time::date) FROM activities
WHERE projectid = 4;