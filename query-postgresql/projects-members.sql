-- select column projectid, projectname, and members without constraint
SELECT proj.projectid, proj.projectname, 
string_agg(concat(users.firstname, ' ', users.lastname), ', ' ORDER BY users.firstname) member
FROM users 
INNER JOIN members ON members.userid = users.userid
INNER JOIN projects proj ON proj.projectid = members.projectid
GROUP BY proj.projectid ORDER BY proj.projectid;

-- select column projectid, projectname, and members with userid constraint
SELECT proj.projectid, proj.projectname, 
string_agg(concat(users.firstname, ' ', users.lastname), ', ' ORDER BY users.firstname) member
FROM users 
INNER JOIN members ON members.userid = users.userid
INNER JOIN projects proj ON proj.projectid = members.projectid
WHERE users.userid IN (
	SELECT userid FROM members WHERE projectid IN (
		SELECT projectid FROM members WHERE userid = 1
	)
) AND proj.projectid IN (
	SELECT projectid FROM members WHERE userid = 1
) 
GROUP BY proj.projectid ORDER BY proj.projectid;

-- select column projectid, projectname, and members with member's name constraint
SELECT proj.projectid, proj.projectname, 
string_agg(concat(users.firstname, ' ', users.lastname), ', ' ORDER BY users.firstname) member
FROM users 
INNER JOIN members ON members.userid = users.userid
INNER JOIN projects proj ON proj.projectid = members.projectid
WHERE users.userid IN (
	SELECT userid FROM members WHERE projectid IN (
		SELECT projectid FROM members WHERE
		userid IN (
			SELECT userid FROM users WHERE
			LOWER(concat(firstname, ' ', lastname)) = LOWER('Syahrul Rofi')
		)
	)
) AND proj.projectid IN (
	SELECT projectid FROM members WHERE 
	userid IN (
		SELECT userid FROM users WHERE
		LOWER(concat(firstname, ' ', lastname)) = LOWER('Syahrul Rofi')
	)
)
GROUP BY proj.projectid ORDER BY proj.projectid;

-- select column projectid, projectname, and members with projectid constraint
SELECT proj.projectid, proj.projectname, 
string_agg(concat(users.firstname, ' ', users.lastname), ', ' ORDER BY users.firstname) member
FROM users 
INNER JOIN members ON members.userid = users.userid
INNER JOIN projects proj ON proj.projectid = members.projectid
WHERE proj.projectid = 1
GROUP BY proj.projectid ORDER BY proj.projectid;

-- select column projectid, projectname, and members with project's name constraint
SELECT proj.projectid, proj.projectname, 
string_agg(concat(users.firstname, ' ', users.lastname), ', ' ORDER BY users.firstname) member
FROM users 
INNER JOIN members ON members.userid = users.userid
INNER JOIN projects proj ON proj.projectid = members.projectid
WHERE LOWER(proj.projectname) LIKE concat('%',LOWER('Web'),'%')
GROUP BY proj.projectid ORDER BY proj.projectid;

-- select all members without constraint
SELECT concat(users.firstname, ' ', users.lastname) member
FROM users 
INNER JOIN members ON members.userid = users.userid
GROUP BY users.userid ORDER BY CONCAT(firstname, ' ', lastname)