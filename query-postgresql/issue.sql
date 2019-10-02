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

SELECT i1.issueid, i1.tracker, i1.subject, i1.description, i1.status, 
i1.priority, CONCAT(u1.firstname, ' ', u1.lastname) assignee_name, i1.startdate, 
i1.duedate, i1.estimatedtime, i1.done, i1.files, i1.spenttime, i1.targetversion,
CONCAT (u2.firstname, ' ', u2.lastname) author_name, i1.createddate, 
i1.updateddate, i1.closeddate, i2.subject parenttask
FROM issues i1
LEFT JOIN users u1 ON i1.assignee = u1.userid
LEFT JOIN users u2 ON i1.author = u2.userid
LEFT JOIN issues i2 ON i1.parenttask = i2.issueid
WHERE i1.projectid = 1
ORDER BY i1.issueid
LIMIT 2 OFFSET 0