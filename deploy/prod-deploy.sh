echo "checking that all local repos are up to date..."
OUTPUT=`sh check.sh`
COUNT=`echo $OUTPUT | grep "Need to pull" | wc -l`
if [ $COUNT = "0" ]
then
    echo "all repos up to date, deploying production..."
    ansible-playbook system.yml -vv --tags fast --skip-tags provision,staging-slack -i hosts -l prod
else
    sh check.sh | grep "Need to pull"
fi

