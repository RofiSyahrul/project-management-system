-- count opened issues per tracker and project
SELECT tracker, COUNT(tracker), max(projectname) projectname
FROM projects
LEFT OUTER JOIN issues USING (projectid)
WHERE projectid = 1
AND status != 'Closed'
GROUP BY tracker ORDER BY tracker

-- count all issues per tracker and project
SELECT tracker, COUNT(tracker), max(projectname) projectname
FROM projects
LEFT OUTER JOIN issues USING (projectid)
WHERE projectid = 1
GROUP BY tracker ORDER BY tracker